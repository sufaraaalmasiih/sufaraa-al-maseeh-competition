"use client";

import { useEffect, useRef, useState } from "react";
import { ErrorState } from "@/components/layout/state-view";
import { Button } from "@/components/ui/button";
import { TimerCountdown } from "@/features/gameflow/components/timer-countdown";
import { useCompetitionTimer } from "@/features/gameflow/use-competition-timer";
import { useGameFlow } from "@/features/gameflow/use-game-flow";
import { autoCloseAndRevealStage3Question } from "@/features/stage3/auto-close-and-reveal-stage3-question";
import { closeStage3Answers } from "@/features/stage3/close-stage3-answers";
import { Stage3FacilitatorAnswersPanel } from "@/features/stage3/components/stage3-facilitator-answers-panel";
import { Stage3QuestionOpenScreen } from "@/features/stage3/components/stage3-question-open-screen";
import { Stage3StartRevealButton } from "@/features/stage3/components/stage3-start-reveal-button";
import type { Stage3QuestionMetadata } from "@/features/stage3/stage3-question-types";

interface Stage3FacilitatorQuestionPanelProps {
  question: Stage3QuestionMetadata | null;
  ownerTeamName: string | null;
}

export function Stage3FacilitatorQuestionPanel({
  question,
  ownerTeamName,
}: Stage3FacilitatorQuestionPanelProps) {
  const { status } = useGameFlow();
  const { timer, remainingSeconds, isExpired } = useCompetitionTimer();
  const [closing, setClosing] = useState(false);
  const [closeError, setCloseError] = useState<string | null>(null);
  const autoRevealAttemptedRef = useRef(false);

  const isQuestionOpen = status === "stage3_question_open";
  const isAnswerClosed = status === "stage3_answer_closed";

  useEffect(() => {
    autoRevealAttemptedRef.current = false;
  }, [question?.id]);

  useEffect(() => {
    if (autoRevealAttemptedRef.current) {
      return;
    }

    const isStage3AnsweringTimer =
      timer?.stage === "stage3" && timer?.purpose === "answering";

    const timerEnded =
      isExpired ||
      (typeof timer?.endsAtMs === "number" && timer.endsAtMs <= Date.now());

    if (!timerEnded) {
      return;
    }

    if (isQuestionOpen && isStage3AnsweringTimer) {
      autoRevealAttemptedRef.current = true;

      void autoCloseAndRevealStage3Question().catch(() => {
        autoRevealAttemptedRef.current = false;
      });
      return;
    }

    if (isAnswerClosed && isStage3AnsweringTimer) {
      autoRevealAttemptedRef.current = true;

      void autoCloseAndRevealStage3Question().catch(() => {
        autoRevealAttemptedRef.current = false;
      });
    }
  }, [
    isQuestionOpen,
    isAnswerClosed,
    isExpired,
    timer?.active,
    timer?.endsAtMs,
    timer?.purpose,
    timer?.stage,
  ]);

  async function handleCloseAnswers() {
    setClosing(true);
    setCloseError(null);

    try {
      await closeStage3Answers();
    } catch (caught) {
      setCloseError(
        caught instanceof Error ? caught.message : "تعذر إغلاق الإجابات.",
      );
    } finally {
      setClosing(false);
    }
  }

  return (
    <div className="stage3-scene stage3-scene--question">
      {timer?.active && timer.stage === "stage3" && timer.purpose === "answering" ? (
        <div className="stage3-answer-timer-corner">
          <TimerCountdown
            remainingSeconds={remainingSeconds}
            isExpired={isExpired}
            label="وقت الإجابة"
            variant="compact"
          />
        </div>
      ) : null}

      {closeError ? <ErrorState title="تعذر المتابعة" description={closeError} /> : null}

      <Stage3QuestionOpenScreen
        question={question}
        ownerTeamName={ownerTeamName}
        variant="facilitator"
      />
      <Stage3FacilitatorAnswersPanel questionId={question?.id ?? null} />

      <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:justify-center">
        {isQuestionOpen ? (
          <Button
            type="button"
            variant="outline"
            disabled={closing}
            onClick={() => {
              void handleCloseAnswers();
            }}
          >
            {closing ? "جاري الإغلاق..." : "إغلاق الإجابات"}
          </Button>
        ) : null}
        {isQuestionOpen || isAnswerClosed ? <Stage3StartRevealButton /> : null}
      </div>
    </div>
  );
}
