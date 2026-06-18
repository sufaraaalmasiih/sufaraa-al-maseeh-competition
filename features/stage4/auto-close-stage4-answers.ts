import { runTransaction, serverTimestamp } from "firebase/firestore";
import { getClientFirestore } from "@/firebase/firebaseClient";
import { gameFlowRef, timerRef } from "@/firebase/firestore";
import { canCloseStage4AnswersNow } from "@/features/stage4/stage4-answer-window";
import { getSyncedNowMs } from "@/lib/server-clock-sync";

export interface AutoCloseStage4AnswersResult {
  skipped: boolean;
  reason?: "window";
}

/**
 * Idempotent: when the Stage 4 answering timer ends, close answers for all teams.
 */
export async function autoCloseStage4Answers(): Promise<AutoCloseStage4AnswersResult> {
  return runTransaction(getClientFirestore(), async (transaction) => {
    const [gameFlowSnapshot, timerSnapshot] = await Promise.all([
      transaction.get(gameFlowRef),
      transaction.get(timerRef),
    ]);

    if (!gameFlowSnapshot.exists()) {
      return { skipped: true };
    }

    const gameFlow = gameFlowSnapshot.data() ?? {};
    if (gameFlow.status !== "stage4_question_open" || gameFlow.currentStage !== "stage4") {
      return { skipped: true };
    }

    const timer = timerSnapshot.exists() ? timerSnapshot.data() : null;
    const now = getSyncedNowMs();

    if (
      !timer ||
      timer.stage !== "stage4" ||
      timer.purpose !== "answering" ||
      typeof timer.endsAtMs !== "number" ||
      timer.endsAtMs > now
    ) {
      return { skipped: true };
    }

    const openedAtMs =
      typeof gameFlow.stage4QuestionOpenedAtMs === "number"
        ? gameFlow.stage4QuestionOpenedAtMs
        : null;

    if (!canCloseStage4AnswersNow(openedAtMs, now)) {
      return { skipped: true, reason: "window" };
    }

    transaction.update(gameFlowRef, {
      status: "stage4_answers_closed",
      currentStage: "stage4",
      updatedAt: serverTimestamp(),
    });
    transaction.update(timerRef, {
      active: false,
      paused: false,
      pausedRemainingMs: 0,
      updatedAt: serverTimestamp(),
    });

    return { skipped: false };
  });
}
