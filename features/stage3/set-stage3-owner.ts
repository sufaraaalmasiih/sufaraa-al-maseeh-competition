import { getDoc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { gameFlowRef, timerRef } from "@/firebase/firestore";
import { findTurnIndexInOrder, parseStage3TurnOrder } from "@/features/stage3/stage3-turn-order";
import { buildStage3SelectionTimerPayload } from "@/features/stage3/stage3-timer-payload";
import { parseTimerDurations } from "@/features/facilitator/facilitator-timer-settings";

/** Emergency override — facilitator manually sets owner team */
export async function setStage3OwnerTeam(teamId: string, teamName: string) {
  const gameFlowSnapshot = await getDoc(gameFlowRef);
  const status = gameFlowSnapshot.data()?.status;
  const selectionSeconds = parseTimerDurations(gameFlowSnapshot.data()?.durations).stage3Selection;

  if (status && status !== "stage3_board" && status !== "stage3_intro") {
    throw new Error("Owner can only be changed on the board.");
  }

  const turnOrder = parseStage3TurnOrder(gameFlowSnapshot.data()?.stage3TurnOrder);
  const turnIndex =
    turnOrder.length > 0 ? findTurnIndexInOrder(turnOrder, teamId) : 0;

  const selectionNow = Date.now();
  const updatedAt = serverTimestamp();

  await updateDoc(gameFlowRef, {
    stage3OwnerTeamId: teamId,
    stage3OwnerTeamName: teamName,
    stage3OwnerTurnIndex: turnIndex,
    stage3SelectionStartedAt: selectionNow,
    updatedAt,
  });

  // Restart the 15s selection window so the new owner gets a fresh timer and
  // the board's auto-timeout stays in sync with the override.
  if (status === "stage3_board") {
    await setDoc(
      timerRef,
      buildStage3SelectionTimerPayload(selectionNow, updatedAt, selectionSeconds),
      { merge: true },
    );
  }
}
