"use client";

import { useEffect, useState } from "react";
import { ArenaLayout } from "@/components/competition/arena-layout";
import { StepJourney } from "@/components/competition/step-journey";
import { QuestionPrompt } from "@/components/competition/question-prompt";
import { QuestionTransition } from "@/components/motion/question-transition";
import { EmptyState } from "@/components/layout/empty-state";
import { useCompetitionTimer } from "@/features/gameflow/use-competition-timer";
import { Stage2MatchingQuestionCard } from "@/features/stage2/components/stage2-matching-question-card";
import { confirmStage2MatchingAnswer } from "@/features/stage2/confirm-stage2-matching-answer";
import type { Stage2MatchingPairings } from "@/features/stage2/stage2-matching";
import { getActiveStage2MatchingQuestions } from "@/features/facilitator/question-bank-runtime-cache";
import { Stage2FieldWaitingScreen } from "@/features/stage2/components/stage2-field-waiting-screen";
import { formatSaveErrorFromCode } from "@/lib/format-save-error";

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
  const { timer, isSubmitExpired } = useCompetitionTimer();

  const hasStage2AnsweringTimer = Boolean(
    timer?.active && timer.stage === "stage2" && timer.purpose === "answering",
  );
  const answeringClosed = Boolean(hasStage2AnsweringTimer && isSubmitExpired);
  const matchingQuestions = getActiveStage2MatchingQuestions();
  const questionCount = matchingQuestions.length;
  const currentQuestion = matchingQuestions[questionIndex];
  const matchingComplete = questionIndex >= questionCount;

  useEffect(() => {
    setQuestionIndex(matchingQuestionIndex);
    setConfirmed(false);
    setSaveError(null);
  }, [matchingQuestionIndex]);

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
    } catch (error) {
      setSaveError(formatSaveErrorFromCode(error));
      setSaving(false);
    }
  }

  if (answeringClosed) {
    return <EmptyState title="انتهى وقت الإجابة، بانتظار توجيه الميسر" />;
  }

  if (matchingComplete || !currentQuestion) {
    return <Stage2FieldWaitingScreen title="تم التوصيل" />;
  }

  return (
    <QuestionTransition questionKey={`stage2-matching-q-${questionIndex}`}>
      <ArenaLayout
        question={
        <QuestionPrompt reference={currentQuestion.reference} imageUrl={currentQuestion.imageUrl} size="arena">
          {currentQuestion.prompt}
        </QuestionPrompt>
      }
      progress={
        <StepJourney current={questionIndex + 1} total={questionCount} />
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
    </QuestionTransition>
  );
}
