"use client";

import { useEffect, useRef } from "react";
import { useGameFlow } from "@/features/gameflow/use-game-flow";
import { parseTrainingEndsAtMs, isTrainingMode } from "@/features/facilitator/competition-mode";
import { wipeTrainingCompetitionData } from "@/features/facilitator/training-mode-wipe";

/**
 * When training mode end time passes, wipe competition data (scores, answers, progress).
 * Question bank and team registrations are preserved.
 */
export function TrainingModeCleanup() {
  const { competitionMode, trainingEndsAtMs } = useGameFlow();
  const attemptedRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isTrainingMode(competitionMode)) {
      return;
    }

    const endsAt = parseTrainingEndsAtMs(trainingEndsAtMs);
    if (!endsAt) {
      return;
    }

    const tick = () => {
      if (Date.now() < endsAt) {
        return;
      }
      if (attemptedRef.current === endsAt) {
        return;
      }
      attemptedRef.current = endsAt;
      void wipeTrainingCompetitionData().catch(() => {
        attemptedRef.current = null;
      });
    };

    tick();
    const intervalId = window.setInterval(tick, 30_000);
    return () => window.clearInterval(intervalId);
  }, [competitionMode, trainingEndsAtMs]);

  return null;
}
