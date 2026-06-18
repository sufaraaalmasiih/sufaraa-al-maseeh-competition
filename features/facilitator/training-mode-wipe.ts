import { updateDoc } from "firebase/firestore";
import { gameFlowRef } from "@/firebase/firestore";
import { resetCompetition } from "@/features/gameflow/competition-reset";

/** Clear live competition data after training ends; keep teams + question bank. */
export async function wipeTrainingCompetitionData(): Promise<void> {
  await resetCompetition();
  await updateDoc(gameFlowRef, {
    competitionMode: "training",
    trainingEndsAtMs: null,
    activeSessionId: null,
  });
}
