import { getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { firebaseAuth } from "@/firebase/firebaseClient";
import { MAIN_COMPETITION_ID, teamRef, teamStateRef } from "@/firebase/firestore";

export async function ensureTeamProfileDoc(uid: string): Promise<void> {
  const profileRef = teamRef(uid);
  const profileSnapshot = await getDoc(profileRef);
  if (profileSnapshot.exists()) {
    return;
  }

  const stateSnapshot = await getDoc(teamStateRef(MAIN_COMPETITION_ID, uid));
  if (!stateSnapshot.exists()) {
    return;
  }

  const state = stateSnapshot.data();
  await setDoc(profileRef, {
    teamName: typeof state.teamName === "string" ? state.teamName : "فريق بدون اسم",
    governorate: typeof state.governorate === "string" ? state.governorate : "",
    email: firebaseAuth.currentUser?.email ?? "",
    role: "team",
    active: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}
