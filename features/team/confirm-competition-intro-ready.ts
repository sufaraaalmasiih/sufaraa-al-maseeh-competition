import { serverTimestamp, updateDoc } from "firebase/firestore";
import { firebaseAuth } from "@/firebase/firebaseClient";
import { teamStateRef } from "@/firebase/firestore";

const MAIN_COMPETITION_ID = "main";

export async function confirmCompetitionIntroReady() {
  const teamId = firebaseAuth.currentUser?.uid;

  if (!teamId) {
    throw new Error("Missing authenticated team.");
  }

  await updateDoc(teamStateRef(MAIN_COMPETITION_ID, teamId), {
    ready: true,
    "readiness.competitionIntro": true,
    updatedAt: serverTimestamp(),
  });
}
