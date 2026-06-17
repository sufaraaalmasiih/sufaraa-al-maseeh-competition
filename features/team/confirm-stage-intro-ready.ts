import { serverTimestamp, updateDoc } from "firebase/firestore";
import { firebaseAuth } from "@/firebase/firebaseClient";
import { teamStateRef } from "@/firebase/firestore";

const MAIN_COMPETITION_ID = "main";

export type TeamStageIntroKey = "stage1" | "stage2" | "stage3" | "stage4";

const READINESS_FIELD: Record<TeamStageIntroKey, string> = {
  stage1: "readiness.stage1Intro",
  stage2: "readiness.stage2Intro",
  stage3: "readiness.stage3Intro",
  stage4: "readiness.stage4Intro",
};

export async function confirmStageIntroReady(stage: TeamStageIntroKey) {
  const teamId = firebaseAuth.currentUser?.uid;

  if (!teamId) {
    throw new Error("Missing authenticated team.");
  }

  await updateDoc(teamStateRef(MAIN_COMPETITION_ID, teamId), {
    [READINESS_FIELD[stage]]: true,
    updatedAt: serverTimestamp(),
  });
}
