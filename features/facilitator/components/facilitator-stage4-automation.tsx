"use client";

import { useEffect, useRef } from "react";
import { useGameFlow } from "@/features/gameflow/use-game-flow";
import { useCompetitionTimer } from "@/features/gameflow/use-competition-timer";
import { autoCloseStage4Answers } from "@/features/stage4/auto-close-stage4-answers";

/**
 * Keeps Stage 4 answer-window automation running even when the facilitator
 * switches tabs away from «سير المسابقة».
 */
export function FacilitatorStage4Automation() {
  const { status, currentStage } = useGameFlow();
  const { timer, isExpired } = useCompetitionTimer();
  const attemptedRef = useRef<string | null>(null);

  useEffect(() => {
    if (currentStage !== "stage4" || !isExpired || !timer?.active || timer.stage !== "stage4") {
      return;
    }

    const fingerprint = `${status ?? ""}:${timer.purpose}:${String(timer.endsAtMs)}`;
    if (attemptedRef.current === fingerprint) {
      return;
    }

    if (status !== "stage4_question_open" || timer.purpose !== "answering") {
      return;
    }

    attemptedRef.current = fingerprint;

    void autoCloseStage4Answers().catch(() => {
      attemptedRef.current = null;
    });
  }, [status, currentStage, isExpired, timer?.active, timer?.stage, timer?.purpose, timer?.endsAtMs]);

  return null;
}
