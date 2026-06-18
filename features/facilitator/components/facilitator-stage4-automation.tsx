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

    let cancelled = false;
    let intervalId: number | undefined;

    const tryClose = () => {
      void autoCloseStage4Answers()
        .then((result) => {
          if (cancelled) {
            return;
          }
          if (!result.skipped) {
            attemptedRef.current = fingerprint;
            if (intervalId !== undefined) {
              window.clearInterval(intervalId);
            }
            return;
          }
          if (result.reason !== "window") {
            attemptedRef.current = fingerprint;
            if (intervalId !== undefined) {
              window.clearInterval(intervalId);
            }
          }
        })
        .catch(() => {
          if (!cancelled) {
            attemptedRef.current = null;
          }
        });
    };

    tryClose();
    intervalId = window.setInterval(tryClose, 1_000);

    return () => {
      cancelled = true;
      if (intervalId !== undefined) {
        window.clearInterval(intervalId);
      }
    };
  }, [status, currentStage, isExpired, timer?.active, timer?.stage, timer?.purpose, timer?.endsAtMs]);

  return null;
}
