"use client";

import { onSnapshot } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { logout } from "@/firebase/auth";
import { competitionSessionRef } from "@/firebase/firestore";
import {
  clearLocalCompetitionReauthEpoch,
  readLocalCompetitionReauthEpoch,
  stampCompetitionReauthEpoch,
} from "@/features/competition-session/competition-session-controls";

const COMPETITION_RESET_STORAGE_KEY = "competitionResetEpoch";

function readLocalResetEpoch(): number {
  try {
    const raw = sessionStorage.getItem(COMPETITION_RESET_STORAGE_KEY);
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : 0;
  } catch {
    return 0;
  }
}

function writeLocalResetEpoch(epoch: number): void {
  try {
    sessionStorage.setItem(COMPETITION_RESET_STORAGE_KEY, String(epoch));
  } catch {
    // Ignore unavailable sessionStorage; the server reset still wins.
  }
}

/**
 * Signs out team players when the facilitator starts a new competition.
 */
export function useCompetitionReauthGuard(enabled: boolean): void {
  const router = useRouter();

  useEffect(() => {
    if (!enabled) {
      return;
    }

    return onSnapshot(competitionSessionRef, async (snapshot) => {
      const serverEpoch = snapshot.data()?.reauthEpoch;
      if (typeof serverEpoch !== "number" || serverEpoch <= 0) {
        const resetEpoch = snapshot.data()?.resetEpoch;
        if (typeof resetEpoch === "number" && resetEpoch > readLocalResetEpoch()) {
          writeLocalResetEpoch(resetEpoch);
          window.location.reload();
        }
        return;
      }

      const resetEpoch = snapshot.data()?.resetEpoch;
      if (typeof resetEpoch === "number" && resetEpoch > readLocalResetEpoch()) {
        writeLocalResetEpoch(resetEpoch);
        window.location.reload();
        return;
      }

      const localEpoch = readLocalCompetitionReauthEpoch();
      if (localEpoch <= 0) {
        await stampCompetitionReauthEpoch();
        return;
      }

      if (serverEpoch > localEpoch) {
        clearLocalCompetitionReauthEpoch();
        try {
          await logout();
        } finally {
          router.replace("/team-login?reason=new_competition");
        }
      }
    });
  }, [enabled, router]);
}
