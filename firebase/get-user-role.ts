import { getDoc } from "firebase/firestore";
import { teamRef, userRef } from "@/firebase/firestore";
import type { AppRole } from "@/types";

function isAdminSideRole(value: unknown): value is Exclude<AppRole, "team"> {
  return value === "viewer" || value === "facilitator" || value === "super_admin";
}

export async function getUserRole(uid: string): Promise<AppRole | null> {
  const teamSnapshot = await getDoc(teamRef(uid));
  if (teamSnapshot.exists()) {
    return "team";
  }

  const userSnapshot = await getDoc(userRef(uid));
  if (!userSnapshot.exists()) {
    return null;
  }

  const role = userSnapshot.data().role;
  return isAdminSideRole(role) ? role : null;
}
