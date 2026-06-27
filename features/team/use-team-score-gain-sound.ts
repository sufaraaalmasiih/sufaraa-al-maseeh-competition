"use client";

import { onAuthStateChanged } from "firebase/auth";
import { onSnapshot } from "firebase/firestore";
import { useEffect, useRef } from "react";
import { firebaseAuth } from "@/firebase/firebaseClient";
import { MAIN_COMPETITION_ID, teamStateRef } from "@/firebase/firestore";
import { playCue } from "@/lib/competition-sound-cues";

export function useTeamScoreGainSound(enabled: boolean): void {
  const previousScoreRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) {
      previousScoreRef.current = null;
      return;
    }

    let unsubscribeState: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(firebaseAuth, (user) => {
      unsubscribeState?.();
      previousScoreRef.current = null;

      if (!user) {
        return;
      }

      unsubscribeState = onSnapshot(teamStateRef(MAIN_COMPETITION_ID, user.uid), (snapshot) => {
        const totalScore = snapshot.data()?.totalScore;
        if (typeof totalScore !== "number") {
          return;
        }

        const previousScore = previousScoreRef.current;
        if (previousScore !== null && totalScore > previousScore) {
          playCue("score_gain");
        }
        previousScoreRef.current = totalScore;
      });
    });

    return () => {
      unsubscribeState?.();
      unsubscribeAuth();
    };
  }, [enabled]);
}
