"use client";

import { useEffect, useRef } from "react";
import { useGameFlow } from "@/features/gameflow/use-game-flow";
import { useCompetitionTimer } from "@/features/gameflow/use-competition-timer";
import { handleStage3SelectionTimeout } from "@/features/stage3/handle-stage3-selection-timeout";
import { autoCloseAndRevealStage3Question } from "@/features/stage3/auto-close-and-reveal-stage3-question";
import { autoFinishStage3RevealAndReturnBoard } from "@/features/stage3/auto-finish-stage3-reveal-and-return-board";

/**
 * Headless watcher that keeps Stage 3 timed automation running regardless of
 * which facilitator tab is active. The individual stage-3 facilitator panels
 * also trigger these handlers, but they unmount when the facilitator switches
 * tabs. The underlying handlers are idempotent (status + advanceKey guarded),
 * so running them here in parallel with the panels is safe.
 */
export function FacilitatorStage3Automation() {
  const { status, currentStage } = useGameFlow();
  const { timer, isExpired } = useCompetitionTimer();
  const attemptedRef = useRef<string | null>(null);

  useEffect(() => {
    if (currentStage !== "stage3" || !isExpired || !timer?.active || timer.stage !== "stage3") {
      return;
    }

    const fingerprint = `${status ?? ""}:${timer.purpose}:${String(timer.endsAtMs)}`;
    if (attemptedRef.current === fingerprint) {
      return;
    }

    let action: (() => Promise<unknown>) | null = null;

    if (status === "stage3_board" && timer.purpose === "selection") {
      action = handleStage3SelectionTimeout;
    } else if (
      (status === "stage3_question_open" || status === "stage3_answer_closed") &&
      timer.purpose === "answering"
    ) {
      action = autoCloseAndRevealStage3Question;
    } else if (status === "stage3_reveal" && timer.purpose === "reveal") {
      action = autoFinishStage3RevealAndReturnBoard;
    }

    if (!action) {
      return;
    }

    attemptedRef.current = fingerprint;

    void action().catch(() => {
      attemptedRef.current = null;
    });
  }, [status, currentStage, isExpired, timer?.active, timer?.stage, timer?.purpose, timer?.endsAtMs]);

  return null;
}
