import { getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { competitionSessionRef } from "@/firebase/firestore";
import { resetCompetition, type CompetitionResetResult } from "@/features/gameflow/competition-reset";

export const COMPETITION_REAUTH_STORAGE_KEY = "competitionReauthEpoch";

export async function getCompetitionReauthEpoch(): Promise<number> {
  const snapshot = await getDoc(competitionSessionRef);
  const epoch = snapshot.data()?.reauthEpoch;
  return typeof epoch === "number" ? epoch : 0;
}

export async function stampCompetitionReauthEpoch(): Promise<void> {
  const epoch = await getCompetitionReauthEpoch();
  if (typeof window !== "undefined") {
    sessionStorage.setItem(COMPETITION_REAUTH_STORAGE_KEY, String(epoch));
  }
}

export function readLocalCompetitionReauthEpoch(): number {
  if (typeof window === "undefined") {
    return 0;
  }
  const raw = sessionStorage.getItem(COMPETITION_REAUTH_STORAGE_KEY);
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function clearLocalCompetitionReauthEpoch(): void {
  if (typeof window !== "undefined") {
    sessionStorage.removeItem(COMPETITION_REAUTH_STORAGE_KEY);
  }
}

/**
 * Full reset + bump reauth epoch so every team client signs out and must log in again.
 */
export async function startNewCompetition(): Promise<CompetitionResetResult> {
  const result = await resetCompetition();
  await setDoc(
    competitionSessionRef,
    {
      reauthEpoch: Date.now(),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
  return result;
}
