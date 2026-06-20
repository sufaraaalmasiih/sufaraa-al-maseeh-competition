import { serverTimestamp, updateDoc } from "firebase/firestore";
import { firebaseAuth } from "@/firebase/firebaseClient";
import { teamStateRef } from "@/firebase/firestore";
import { ensureTeamStateDoc } from "@/lib/ensure-team-profile";

const MAIN_COMPETITION_ID = "main";

export async function confirmTeamReady() {
  const teamId = firebaseAuth.currentUser?.uid;

  if (!teamId) {
    throw new Error("Missing authenticated team.");
  }

  // تأكّد من وجود حالة الفريق (قد تكون حُذفت ببدء مسابقة جديدة) قبل تحديث الجاهزية.
  await ensureTeamStateDoc(teamId);

  await updateDoc(teamStateRef(MAIN_COMPETITION_ID, teamId), {
    ready: true,
    updatedAt: serverTimestamp(),
  });
}
