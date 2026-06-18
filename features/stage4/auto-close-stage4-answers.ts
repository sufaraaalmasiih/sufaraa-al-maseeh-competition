import { getDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { gameFlowRef, timerRef } from "@/firebase/firestore";
import { getSyncedNowMs } from "@/lib/server-clock-sync";

export interface AutoCloseStage4AnswersResult {
  skipped: boolean;
}

/**
 * Idempotent: when the Stage 4 answering timer ends, close answers for all teams.
 */
export async function autoCloseStage4Answers(): Promise<AutoCloseStage4AnswersResult> {
  const [gameFlowSnapshot, timerSnapshot] = await Promise.all([
    getDoc(gameFlowRef),
    getDoc(timerRef),
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

  await Promise.all([
    updateDoc(gameFlowRef, {
      status: "stage4_answers_closed",
      currentStage: "stage4",
      updatedAt: serverTimestamp(),
    }),
    updateDoc(timerRef, {
      active: false,
      paused: false,
      pausedRemainingMs: 0,
      updatedAt: serverTimestamp(),
    }),
  ]);

  return { skipped: false };
}
