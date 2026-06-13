"use client";

import { useEffect, useRef } from "react";
import { useGameFlow } from "@/features/gameflow/use-game-flow";
import { useCompetitionTimer } from "@/features/gameflow/use-competition-timer";
import { finishStage, setGameFlowStatus } from "@/features/facilitator/facilitator-flow-actions";

/**
 * Headless watcher that auto-advances the timed phases of stages 1 and 2 when
 * their central timer expires, mirroring the stage-3 automation:
 * - stage1_running + stage1 timer ends → finish stage 1.
 * - stage2_reading + reading timer ends → move to the answering turns.
 *
 * A paused timer never reports as expired, so this stays idle while paused.
 * The actions are status-targeted setDoc/updateDoc writes, so a repeated call
 * from another facilitator device just re-applies the same state.
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
    } else if (
      status === "stage2_reading" &&
      timer.stage === "stage2" &&
      timer.purpose === "reading"
    ) {
      action = () => setGameFlowStatus("stage2_player_turns", "stage2");
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
