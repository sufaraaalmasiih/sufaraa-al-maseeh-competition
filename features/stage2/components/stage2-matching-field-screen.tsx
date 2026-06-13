"use client";

import { useEffect, useState } from "react";
import { ArenaLayout } from "@/components/competition/arena-layout";
import { StepJourney } from "@/components/competition/step-journey";
import { QuestionPrompt } from "@/components/competition/question-prompt";
import { EmptyState } from "@/components/layout/empty-state";
import { useCompetitionTimer } from "@/features/gameflow/use-competition-timer";
import { Stage2MatchingQuestionCard } from "@/features/stage2/components/stage2-matching-question-card";
import { confirmStage2MatchingAnswer } from "@/features/stage2/confirm-stage2-matching-answer";
import { STAGE2_QUESTION_ADVANCE_MS } from "@/features/stage2/stage2-constants";
import type { Stage2MatchingPairings } from "@/features/stage2/stage2-matching";
import {
  STAGE2_MATCHING_QUESTION_COUNT,
  stage2MatchingMockQuestions,
} from "@/features/stage2/stage2-matching-mock-questions";

interface Stage2MatchingFieldScreenProps {
  assignedPlayerName: string;
  matchingQuestionIndex: number;
}

export function Stage2MatchingFieldScreen({
  assignedPlayerName,
  matchingQuestionIndex,
}: Stage2MatchingFieldScreenProps) {
  const [questionIndex, setQuestionIndex] = useState(matchingQuestionIndex);
  const [confirmed, setConfirmed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const { timer, remainingSeconds, isExpired } = useCompetitionTimer();

  const hasStage2AnsweringTimer = Boolean(
    timer?.active && timer.stage === "stage2" && timer.purpose === "answering",
  );
  const answeringClosed = Boolean(hasStage2AnsweringTimer && isExpired);
  const currentQuestion = stage2MatchingMockQuestions[questionIndex];
  const matchingComplete = questionIndex >= STAGE2_MATCHING_QUESTION_COUNT;

  useEffect(() => {
    setQuestionIndex(matchingQuestionIndex);
    setConfirmed(false);
    setSaveError(null);
  }, [matchingQuestionIndex]);

  function goToNextQuestion() {
    setQuestionIndex((current) => current + 1);
    setConfirmed(false);
    setSaveError(null);
  }

  async function handleConfirm(pairings: Stage2MatchingPairings) {
    if (answeringClosed || confirmed || saving || !currentQuestion) {
      return;
    }

    setSaving(true);
    setSaveError(null);
    try {
      await confirmStage2MatchingAnswer({
        question: currentQuestion,
        questionIndex,
        pairings,
      });
      setConfirmed(true);
      setSaving(false);
      window.setTimeout(goToNextQuestion, STAGE2_QUESTION_ADVANCE_MS);
    } catch {
      setSaveError("تعذر حفظ الإجابة. تحقق من الاتصال وحاول مرة أخرى.");
      setSaving(false);
    }
  }

  if (answeringClosed) {
    return <EmptyState title="انتهى وقت الإجابة، بانتظار توجيه الميسر" />;
  }

  if (matchingComplete || !currentQuestion) {
    return (
      <div className="arena-scene items-center justify-center">
        <p className="arena-question-text text-2xl sm:text-3xl">
          تم التوصيل، بانتظار توجيه الميسر
        </p>
      </div>
    );
  }

  return (
    <ArenaLayout
      question={
        <QuestionPrompt reference={currentQuestion.reference} size="arena">
          {currentQuestion.prompt}
        </QuestionPrompt>
      }
      progress={
        <StepJourney current={questionIndex + 1} total={STAGE2_MATCHING_QUESTION_COUNT} />
      }
      board={
        <Stage2MatchingQuestionCard
          confirmed={confirmed}
          disabled={answeringClosed || saving}
          hideQuestion
          question={currentQuestion}
          saveError={saveError}
          saving={saving}
          onConfirm={(pairings) => {
            void handleConfirm(pairings);
          }}
        />
      }
    />
  );
}
