import { runTransaction, serverTimestamp } from "firebase/firestore";
import { getClientFirestore } from "@/firebase/firebaseClient";
import { gameFlowRef, timerRef } from "@/firebase/firestore";
import { markAnswersVisibleToAudience } from "@/features/competition/mark-answers-visible-to-audience";
import { parseStage4QuestionMetadata } from "@/features/stage4/stage4-question-metadata";
import { parseTimerDurations } from "@/features/facilitator/facilitator-timer-settings";
import { buildStage4PhaseTimerPayload } from "@/features/gameflow/stage4-phase-timer";
import { resolveSyncedNowMs } from "@/lib/server-clock-sync";

export async function startStage4Reveal() {
  const now = await resolveSyncedNowMs(true);
  let questionId: string | null = null;

  await runTransaction(getClientFirestore(), async (transaction) => {
    const gameFlowSnapshot = await transaction.get(gameFlowRef);

    if (!gameFlowSnapshot.exists()) {
      throw new Error("Game flow document is missing.");
    }

    const gameFlow = gameFlowSnapshot.data();
    if (gameFlow?.status !== "stage4_answers_closed") {
      throw new Error("لا يمكن بدء الإعلان قبل إغلاق الإجابات.");
    }

    const activeQuestion = parseStage4QuestionMetadata(gameFlow.stage4ActiveQuestion);
    questionId = activeQuestion?.id ?? null;

    const revealSeconds = parseTimerDurations(gameFlow.durations).stage4Reveal;

    transaction.update(gameFlowRef, {
      status: "stage4_reveal",
      currentStage: "stage4",
      stage4RevealStartedAt: now,
      updatedAt: serverTimestamp(),
    });
    // مؤقت الإعلان — تنتقل الأتمتة للسؤال التالي تلقائياً عند انتهائه.
    transaction.set(
      timerRef,
      buildStage4PhaseTimerPayload(now, serverTimestamp(), "reveal", revealSeconds),
      { merge: true },
    );
  });

  if (questionId) {
    await markAnswersVisibleToAudience("stage4", questionId);
  }
}
