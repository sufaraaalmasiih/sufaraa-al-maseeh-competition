import { runTransaction, serverTimestamp, setDoc } from "firebase/firestore";
import { getClientFirestore } from "@/firebase/firebaseClient";
import { gameFlowRef, timerRef } from "@/firebase/firestore";
import { markAnswersVisibleToAudience } from "@/features/competition/mark-answers-visible-to-audience";
import {
  parseStage3QuestionMetadata,
  parseStage3UsedQuestionIds,
} from "@/features/stage3/stage3-question-metadata";
import { buildStage3RevealTimerPayload } from "@/features/stage3/stage3-timer-payload";
import { parseTimerDurations } from "@/features/facilitator/facilitator-timer-settings";
import { getSyncedNowMs } from "@/lib/server-clock-sync";

/**
 * B2: Commit gameFlow → reveal first (blocks late confirms), then load answers
 * and set visibleToAudience so late commits before the transition are included.
 */
export async function startStage3Reveal() {
  const { questionId } = await runTransaction(getClientFirestore(), async (transaction) => {
    const gameFlowSnapshot = await transaction.get(gameFlowRef);
    const gameFlow = gameFlowSnapshot.data();

    if (!gameFlow) {
      throw new Error("Game flow is missing.");
    }

    const status = gameFlow.status;

    if (status !== "stage3_question_open" && status !== "stage3_answer_closed") {
      throw new Error("Reveal is only available after answers are open or closed.");
    }

    const activeQuestion = parseStage3QuestionMetadata(gameFlow.stage3ActiveQuestion);

    if (!activeQuestion) {
      throw new Error("Active question is missing.");
    }

    const usedQuestionIds = parseStage3UsedQuestionIds(gameFlow.stage3UsedQuestionIds);
    const nextUsedIds = usedQuestionIds.includes(activeQuestion.id)
      ? usedQuestionIds
      : [...usedQuestionIds, activeQuestion.id];

    const now = getSyncedNowMs();
    const revealSeconds = parseTimerDurations(gameFlow.durations).stage3Reveal;

    transaction.update(gameFlowRef, {
      status: "stage3_reveal",
      currentStage: "stage3",
      stage3UsedQuestionIds: nextUsedIds,
      updatedAt: serverTimestamp(),
    });

    transaction.set(
      timerRef,
      buildStage3RevealTimerPayload(now, serverTimestamp(), revealSeconds),
      { merge: true },
    );

    return { questionId: activeQuestion.id };
  });

  await markAnswersVisibleToAudience("stage3", questionId);
}
