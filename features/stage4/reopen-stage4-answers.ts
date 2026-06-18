import { runTransaction, serverTimestamp } from "firebase/firestore";
import { getClientFirestore } from "@/firebase/firebaseClient";
import { gameFlowRef, timerRef } from "@/firebase/firestore";
import { buildStage4AnsweringTimerPayload } from "@/features/gameflow/stage4-answering-timer";
import { parseTimerDurations } from "@/features/facilitator/facilitator-timer-settings";
import { resolveSyncedNowMs } from "@/lib/server-clock-sync";

/** Re-open answer window after premature close so teams can respond. */
export async function reopenStage4Answers() {
  const now = await resolveSyncedNowMs(true);

  await runTransaction(getClientFirestore(), async (transaction) => {
    const gameFlowSnapshot = await transaction.get(gameFlowRef);

    if (!gameFlowSnapshot.exists()) {
      throw new Error("Game flow document is missing.");
    }

    const gameFlow = gameFlowSnapshot.data();
    if (gameFlow?.status !== "stage4_answers_closed") {
      throw new Error("يمكن إعادة فتح الإجابات فقط بعد إغلاقها.");
    }

    const answerSeconds = parseTimerDurations(gameFlow.durations).stage4Answer;

    transaction.update(gameFlowRef, {
      status: "stage4_question_open",
      currentStage: "stage4",
      stage4QuestionOpenedAtMs: now,
      updatedAt: serverTimestamp(),
    });

    transaction.set(
      timerRef,
      buildStage4AnsweringTimerPayload(now, serverTimestamp(), answerSeconds),
      { merge: true },
    );
  });
}
