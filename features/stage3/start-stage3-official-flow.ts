import { getDocs, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { gameFlowRef, teamStatesCollectionRef, timerRef } from "@/firebase/firestore";
import { buildStage3SelectionTimerPayload } from "@/features/stage3/stage3-timer-payload";
import { buildStage3TurnOrder } from "@/features/stage3/stage3-turn-order";
import { fetchTimerDurations } from "@/features/facilitator/facilitator-timer-settings";

const MAIN_COMPETITION_ID = "main";

/**
 * Official Stage 3 start: rank teams by totalScore, set first owner, start 15s selection timer.
 */
export async function startStage3OfficialFlow() {
  const snapshot = await getDocs(teamStatesCollectionRef(MAIN_COMPETITION_ID));
  const turnOrder = buildStage3TurnOrder(
    snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        teamId: typeof data.teamId === "string" ? data.teamId : doc.id,
        teamName: typeof data.teamName === "string" ? data.teamName : "فريق بدون اسم",
        totalScore: typeof data.totalScore === "number" ? data.totalScore : 0,
      };
    }),
  );

  const firstTeam = turnOrder[0];

  if (!firstTeam) {
    throw new Error("No teams registered for Stage 3.");
  }

  const now = Date.now();
  const updatedAt = serverTimestamp();
  const selectionSeconds = (await fetchTimerDurations()).stage3Selection;

  await Promise.all([
    updateDoc(gameFlowRef, {
      status: "stage3_board",
      currentStage: "stage3",
      stage3ActiveQuestion: null,
      stage3TurnOrder: turnOrder,
      stage3OwnerTeamId: firstTeam.teamId,
      stage3OwnerTeamName: firstTeam.teamName,
      stage3OwnerTurnIndex: 0,
      stage3SelectionStartedAt: now,
      stage3LastAutoAdvanceKey: "",
      stage3LastSelectionTimeoutKey: "",
      stage3SelectionTimeoutNotice: null,
      stage3RoundId: String(now),
      updatedAt,
    }),
    setDoc(timerRef, buildStage3SelectionTimerPayload(now, updatedAt, selectionSeconds), {
      merge: true,
    }),
  ]);
}
