"use client";

import { useEffect, useRef, useState } from "react";
import { ErrorState } from "@/components/layout/state-view";
import { Button } from "@/components/ui/button";
import { TimerCountdown } from "@/features/gameflow/components/timer-countdown";
import { useCompetitionTimer } from "@/features/gameflow/use-competition-timer";
import { autoFinishStage3RevealAndReturnBoard } from "@/features/stage3/auto-finish-stage3-reveal-and-return-board";
import { Stage3RevealResultsTable } from "@/features/stage3/components/stage3-reveal-results-table";
import { Stage3RevealSummary } from "@/features/stage3/components/stage3-reveal-summary";
import { finishStage3Reveal } from "@/features/stage3/finish-stage3-reveal";
import { returnToStage3Board } from "@/features/stage3/return-to-stage3-board";
import { useStage3ActiveAnswers } from "@/features/stage3/use-stage3-active-answers";
import type { Stage3QuestionMetadata } from "@/features/stage3/stage3-question-types";

interface Stage3FacilitatorRevealPanelProps {
  question: Stage3QuestionMetadata | null;
  ownerTeamName: string | null;
}

export function Stage3FacilitatorRevealPanel({
  question,
  ownerTeamName,
}: Stage3FacilitatorRevealPanelProps) {
  const { timer, remainingSeconds, isExpired } = useCompetitionTimer();
  const { answers, loading, error } = useStage3ActiveAnswers(question?.id ?? null);
  const [pending, setPending] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const autoReturnAttemptedRef = useRef(false);

  useEffect(() => {
    autoReturnAttemptedRef.current = false;
  }, [question?.id]);

  useEffect(() => {
    if (
      !isExpired ||
      autoReturnAttemptedRef.current ||
      !timer?.active ||
      timer.stage !== "stage3" ||
      timer.purpose !== "reveal"
    ) {
      return;
    }

    autoReturnAttemptedRef.current = true;

    void autoFinishStage3RevealAndReturnBoard().catch(() => {
      autoReturnAttemptedRef.current = false;
    });
  }, [isExpired, timer?.active, timer?.purpose, timer?.stage]);

  async function handleManualReturnBoard() {
    setPending(true);
    setActionError(null);

    try {
      await finishStage3Reveal();
      await returnToStage3Board();
    } catch {
      setActionError("تعذر العودة إلى اللوحة.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="stage3-scene">
      {actionError ? <ErrorState title="تعذر المتابعة" description={actionError} /> : null}

      {timer?.active && timer.stage === "stage3" && timer.purpose === "reveal" ? (
        <TimerCountdown
          remainingSeconds={remainingSeconds}
          isExpired={isExpired}
          label="وقت الإعلان"
        />
      ) : null}

      <Stage3RevealSummary question={question} ownerTeamName={ownerTeamName} />
      <Stage3RevealResultsTable answers={answers} loading={loading} error={error} />

      <div className="flex justify-center">
        <Button
          type="button"
          variant="outline"
          disabled={pending}
          onClick={() => void handleManualReturnBoard()}
        >
          {pending ? "جاري العودة..." : "العودة للوحة (يدوي)"}
        </Button>
      </div>
    </div>
  );
}
