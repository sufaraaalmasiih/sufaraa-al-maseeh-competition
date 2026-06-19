import { getDoc, type DocumentReference, type DocumentSnapshot } from "firebase/firestore";
import { coachRef, teamRef, userRef } from "@/firebase/firestore";
import type { AppRole } from "@/types";

const ROLE_DOC_TIMEOUT_MS = 4_000;

function isAdminSideRole(value: unknown): value is Exclude<AppRole, "team"> {
  return value === "viewer" || value === "facilitator" || value === "super_admin";
}

async function getDocWithTimeout(
  ref: DocumentReference,
  label: string,
): Promise<DocumentSnapshot> {
  return Promise.race([
    getDoc(ref),
    new Promise<never>((_, reject) => {
      window.setTimeout(() => {
        reject(new Error(`${label} timed out after ${ROLE_DOC_TIMEOUT_MS}ms`));
      }, ROLE_DOC_TIMEOUT_MS);
    }),
  ]);
}

export async function getUserRole(uid: string): Promise<AppRole | null> {
  const teamSnapshot = await getDocWithTimeout(teamRef(uid), "teamRef");
  if (teamSnapshot.exists()) {
    return "team";
  }

  const coachSnapshot = await getDocWithTimeout(coachRef(uid), "coachRef");
  if (coachSnapshot.exists()) {
    return "coach";
  }

  const userSnapshot = await getDocWithTimeout(userRef(uid), "userRef");
  if (!userSnapshot.exists()) {
    return null;
  }

  const role = userSnapshot.data().role;
  return isAdminSideRole(role) ? role : null;
}
