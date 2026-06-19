import { getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { firebaseAuth } from "@/firebase/firebaseClient";
import {
  createInitialTeamState,
  MAIN_COMPETITION_ID,
  teamRef,
  teamStateRef,
} from "@/firebase/firestore";

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

/**
 * يُعيد إنشاء حالة الفريق (teamState) من ملفه إن كانت غير موجودة — يُستدعى عند تسجيل
 * دخول الفريق، فيعود للظهور في المسابقة بعد «بدء مسابقة جديدة» أو «الإخراج من المسابقة».
 */
export async function ensureTeamStateDoc(uid: string): Promise<void> {
  const stateSnapshot = await getDoc(teamStateRef(MAIN_COMPETITION_ID, uid));
  if (stateSnapshot.exists()) {
    return;
  }

  const profileSnapshot = await getDoc(teamRef(uid));
  if (!profileSnapshot.exists()) {
    return;
  }

  const profile = profileSnapshot.data();
  await createInitialTeamState(MAIN_COMPETITION_ID, uid, {
    teamName: typeof profile.teamName === "string" ? profile.teamName : "فريق بدون اسم",
    governorate: typeof profile.governorate === "string" ? profile.governorate : "",
  });
}
