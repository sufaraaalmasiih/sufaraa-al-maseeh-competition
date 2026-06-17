import { runTransaction, serverTimestamp } from "firebase/firestore";
import { getClientFirestore } from "@/firebase/firebaseClient";
import { gameFlowRef, timerRef } from "@/firebase/firestore";
import { markStage3AnswersVisibleToAudience } from "@/features/stage3/mark-stage3-answers-visible";import {
  parseStage3QuestionMetadata,
  parseStage3UsedQuestionIds,
} from "@/features/stage3/stage3-question-metadata";
import { buildStage3RevealTimerPayload } from "@/features/stage3/stage3-timer-payload";
import { parseTimerDurations } from "@/features/facilitator/facilitator-timer-settings";

const SKIP_STATUSES = new Set([
  "stage3_reveal",
  "stage3_results_done",
  "stage3_board",
  "stage3_finished",
]);

export interface AutoCloseAndRevealResult {  skipped: boolean;
  questionId?: string;
}

/**
 * Idempotent: when the answering timer ends, close answers and move to reveal.
 * Safe to call from multiple clients — only the first successful transaction wins.
 */
export async function autoCloseAndRevealStage3Question(): Promise<AutoCloseAndRevealResult> {
  const result = await runTransaction(getClientFirestore(), async (transaction) => {
    const [gameFlowSnapshot, timerSnapshot] = await Promise.all([
      transaction.get(gameFlowRef),
      transaction.get(timerRef),
    ]);

    if (!gameFlowSnapshot.exists()) {
      throw new Error("Game flow document is missing.");
    }

    const gameFlow = gameFlowSnapshot.data() ?? {};
    const status = gameFlow.status;
    const currentStage = gameFlow.currentStage;

    if (currentStage !== "stage3") {
      return { skipped: true as const };
    }

    if (typeof status === "string" && SKIP_STATUSES.has(status)) {
      return { skipped: true as const };
    }

    if (status !== "stage3_question_open" && status !== "stage3_answer_closed") {
      return { skipped: true as const };
    }

    const timer = timerSnapshot.exists() ? timerSnapshot.data() : null;
    const now = Date.now();
    const answeringTimerEnded =
      timer?.stage === "stage3" &&
      timer?.purpose === "answering" &&
      typeof timer.endsAtMs === "number" &&
      timer.endsAtMs <= now;

    const closedAfterAnsweringEnded =
      status === "stage3_answer_closed" &&
      timer?.stage === "stage3" &&
      (timer?.purpose !== "answering" || timer?.active === false) &&
      typeof timer?.endsAtMs === "number" &&
      timer.endsAtMs <= now;

    if (!answeringTimerEnded && !closedAfterAnsweringEnded) {
      return { skipped: true as const };
    }

    const activeQuestion = parseStage3QuestionMetadata(gameFlow.stage3ActiveQuestion);

    if (!activeQuestion) {
      throw new Error("Active question is missing.");
    }

    const usedQuestionIds = parseStage3UsedQuestionIds(gameFlow.stage3UsedQuestionIds);
    const nextUsedIds = usedQuestionIds.includes(activeQuestion.id)
      ? usedQuestionIds
      : [...usedQuestionIds, activeQuestion.id];

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

    return { skipped: false as const, questionId: activeQuestion.id };
  });

  if (result.skipped || !result.questionId) {
    return { skipped: true };
  }

  await markStage3AnswersVisibleToAudience(result.questionId);
  return { skipped: false, questionId: result.questionId };
}

/** Official flow alias */
export const autoCloseStage3AnswersAndReveal = autoCloseAndRevealStage3Question;
