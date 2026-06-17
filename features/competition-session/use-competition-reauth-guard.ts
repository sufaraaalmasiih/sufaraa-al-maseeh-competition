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
