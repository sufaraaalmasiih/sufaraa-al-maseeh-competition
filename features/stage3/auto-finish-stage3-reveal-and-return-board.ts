import { runTransaction, serverTimestamp } from "firebase/firestore";
import { getClientFirestore } from "@/firebase/firebaseClient";
import { gameFlowRef, timerRef } from "@/firebase/firestore";
import { buildStage3SelectionTimerPayload } from "@/features/stage3/stage3-timer-payload";
import {
  getNextTurnIndex,
  parseStage3TurnOrder,
  resolveOwnerFromTurnOrder,
} from "@/features/stage3/stage3-turn-order";
import {
  parseStage3OwnerTurnIndex,
  parseStage3QuestionMetadata,
} from "@/features/stage3/stage3-question-metadata";
import { parseTimerDurations } from "@/features/facilitator/facilitator-timer-settings";

export interface AutoFinishStage3RevealResult {
  skipped: boolean;
}

/**
 * Idempotent: after 10s reveal timer → return to board, advance owner, start 15s selection timer.
 */
export async function autoFinishStage3RevealAndReturnBoard(): Promise<AutoFinishStage3RevealResult> {
  const result = await runTransaction(getClientFirestore(), async (transaction) => {
    const [gameFlowSnapshot, timerSnapshot] = await Promise.all([
      transaction.get(gameFlowRef),
      transaction.get(timerRef),
    ]);

    if (!gameFlowSnapshot.exists()) {
      throw new Error("Game flow document is missing.");
    }

    const gameFlow = gameFlowSnapshot.data() ?? {};

    if (gameFlow.status !== "stage3_reveal" || gameFlow.currentStage !== "stage3") {
      return { skipped: true as const };
    }

    const timer = timerSnapshot.exists() ? timerSnapshot.data() : null;
    const now = Date.now();

    if (
      !timer ||
      timer.stage !== "stage3" ||
      timer.purpose !== "reveal" ||
      typeof timer.endsAtMs !== "number" ||
      timer.endsAtMs > now
    ) {
      return { skipped: true as const };
    }

    const activeQuestion = parseStage3QuestionMetadata(gameFlow.stage3ActiveQuestion);
    const advanceKey = `reveal_${String(timer.endsAtMs)}_${activeQuestion?.id ?? "none"}`;

    if (gameFlow.stage3LastAutoAdvanceKey === advanceKey) {
      return { skipped: true as const };
    }

    const turnOrder = parseStage3TurnOrder(gameFlow.stage3TurnOrder);

    if (turnOrder.length === 0) {
      throw new Error("Stage 3 turn order is missing.");
    }

    const currentIndex = parseStage3OwnerTurnIndex(gameFlow.stage3OwnerTurnIndex);
    const nextIndex = getNextTurnIndex(currentIndex, turnOrder.length);
    const nextTeam = resolveOwnerFromTurnOrder(turnOrder, nextIndex);

    if (!nextTeam) {
      throw new Error("Could not resolve next owner team.");
    }

    const selectionNow = Date.now();
    const updatedAt = serverTimestamp();
    const selectionSeconds = parseTimerDurations(gameFlow.durations).stage3Selection;

    transaction.update(gameFlowRef, {
      status: "stage3_board",
      currentStage: "stage3",
      stage3ActiveQuestion: null,
      stage3OwnerTurnIndex: nextIndex,
      stage3OwnerTeamId: nextTeam.teamId,
      stage3OwnerTeamName: nextTeam.teamName,
      stage3SelectionStartedAt: selectionNow,
      stage3LastAutoAdvanceKey: advanceKey,
      updatedAt,
    });

    transaction.set(
      timerRef,
      buildStage3SelectionTimerPayload(selectionNow, updatedAt, selectionSeconds),
      { merge: true },
    );

    return { skipped: false as const };
  });

  return { skipped: result.skipped };
}
