"use client";

import { useEffect, useRef } from "react";
import { useGameFlow } from "@/features/gameflow/use-game-flow";
import { useCompetitionTimer } from "@/features/gameflow/use-competition-timer";
import { finishStage } from "@/features/facilitator/facilitator-flow-actions";

/**
 * Headless watcher that auto-advances stage 1 when its central timer expires:
 * - stage1_running + stage1 timer ends → finish stage 1.
 *
 * Stage 2 reading does NOT auto-advance: when the reading timer ends, the teams
 * see a waiting screen and the facilitator starts the field questions manually
 * via the "بدء أسئلة المجالات" control.
 *
 * A paused timer never reports as expired, so this stays idle while paused.
 */
export function FacilitatorStage12Automation() {
  const { status } = useGameFlow();
  const { timer, isExpired } = useCompetitionTimer();
  const attemptedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isExpired || !timer?.active) {
      return;
    }

    const fingerprint = `${status ?? ""}:${timer.stage}:${timer.purpose}:${String(timer.endsAtMs)}`;
    if (attemptedRef.current === fingerprint) {
      return;
    }

    let action: (() => Promise<unknown>) | null = null;

    if (status === "stage1_running" && timer.stage === "stage1") {
      action = () => finishStage(1);
    }

    if (!action) {
      return;
    }

    attemptedRef.current = fingerprint;

    void action().catch(() => {
      attemptedRef.current = null;
    });
  }, [status, isExpired, timer?.active, timer?.stage, timer?.purpose, timer?.endsAtMs]);

  return null;
}
