import { getDoc, runTransaction, serverTimestamp, setDoc } from "firebase/firestore";
import { getClientFirestore } from "@/firebase/firebaseClient";
import { gameFlowRef, timerRef } from "@/firebase/firestore";
import { buildStage3SelectionTimerPayload } from "@/features/stage3/stage3-timer-payload";
import {
  getNextTurnIndex,
  parseStage3TurnOrder,
  resolveOwnerFromTurnOrder,
} from "@/features/stage3/stage3-turn-order";
import { parseStage3OwnerTurnIndex } from "@/features/stage3/stage3-question-metadata";
import { parseTimerDurations } from "@/features/facilitator/facilitator-timer-settings";

interface AdvanceStage3TurnInput {
  rotateOwner?: boolean;
}

/**
 * Returns to board — optionally rotates to next owner team; restarts 15s selection timer.
 */
export async function advanceStage3Turn({ rotateOwner = true }: AdvanceStage3TurnInput = {}) {
  await runTransaction(getClientFirestore(), async (transaction) => {
    const gameFlowSnapshot = await transaction.get(gameFlowRef);

    if (!gameFlowSnapshot.exists()) {
      throw new Error("Game flow document is missing.");
    }

    const gameFlow = gameFlowSnapshot.data() ?? {};
    const turnOrder = parseStage3TurnOrder(gameFlow.stage3TurnOrder);

    if (turnOrder.length === 0) {
      throw new Error("Stage 3 turn order is missing. Start official flow first.");
    }

    const currentIndex = parseStage3OwnerTurnIndex(gameFlow.stage3OwnerTurnIndex);
    const nextIndex = rotateOwner
      ? getNextTurnIndex(currentIndex, turnOrder.length)
      : currentIndex;
    const nextTeam = resolveOwnerFromTurnOrder(turnOrder, nextIndex);

    if (!nextTeam) {
      throw new Error("Could not resolve next turn team.");
    }

    const now = Date.now();
    const updatedAt = serverTimestamp();
    const selectionSeconds = parseTimerDurations(gameFlow.durations).stage3Selection;

    transaction.update(gameFlowRef, {
      status: "stage3_board",
      currentStage: "stage3",
      stage3ActiveQuestion: null,
      stage3OwnerTeamId: nextTeam.teamId,
      stage3OwnerTeamName: nextTeam.teamName,
      stage3OwnerTurnIndex: nextIndex,
      stage3SelectionStartedAt: now,
      updatedAt,
    });

    transaction.set(
      timerRef,
      buildStage3SelectionTimerPayload(now, updatedAt, selectionSeconds),
      { merge: true },
    );
  });
}
