"use client";

import { useEffect, useMemo, useState } from "react";
import { ArenaLayout } from "@/components/competition/arena-layout";
import { StepJourney } from "@/components/competition/step-journey";
import { QuestionPrompt } from "@/components/competition/question-prompt";
import { QuestionTransition } from "@/components/motion/question-transition";
import { EmptyState } from "@/components/layout/empty-state";
import { useCompetitionTimer } from "@/features/gameflow/use-competition-timer";
import { Stage2ArrangeVerseQuestionCard } from "@/features/stage2/components/stage2-arrange-verse-question-card";
import { confirmStage2ArrangeVerseAnswer } from "@/features/stage2/confirm-stage2-arrange-verse-answer";
import { Stage2FieldWaitingScreen } from "@/features/stage2/components/stage2-field-waiting-screen";
import { getActiveStage2ArrangeVerseQuestions } from "@/features/facilitator/question-bank-runtime-cache";
import { formatSaveErrorFromCode } from "@/lib/format-save-error";

interface Stage2ArrangeVerseFieldScreenProps {
  assignedPlayerName: string;
  arrangeVerseQuestionIndex: number;
  teamId: string;
}

export function Stage2ArrangeVerseFieldScreen({
  assignedPlayerName,
  arrangeVerseQuestionIndex,
  teamId,
}: Stage2ArrangeVerseFieldScreenProps) {
  const [questionIndex, setQuestionIndex] = useState(arrangeVerseQuestionIndex);
  const [confirmed, setConfirmed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const { timer, isSubmitExpired } = useCompetitionTimer();

  const hasStage2AnsweringTimer = Boolean(
    timer?.active && timer.stage === "stage2" && timer.purpose === "answering",
  );
  const answeringClosed = Boolean(hasStage2AnsweringTimer && isSubmitExpired);
  const arrangeVerseQuestions = getActiveStage2ArrangeVerseQuestions();
  const questionCount = arrangeVerseQuestions.length;
  const currentQuestion = arrangeVerseQuestions[questionIndex];
  const arrangeVerseComplete = questionIndex >= questionCount;

  const shuffleSeed = useMemo(
    () => `${teamId ?? "team"}|${currentQuestion?.id ?? questionIndex}`,
    [teamId, currentQuestion?.id, questionIndex],
  );

  useEffect(() => {
    setQuestionIndex(arrangeVerseQuestionIndex);
    setConfirmed(false);
    setSaveError(null);
  }, [arrangeVerseQuestionIndex]);

  async function handleConfirm(orderedFragments: string[]) {
    if (answeringClosed || confirmed || saving || !currentQuestion) {
      return;
    }

    setSaving(true);
    setSaveError(null);
    try {
      await confirmStage2ArrangeVerseAnswer({
        question: currentQuestion,
        questionIndex,
        orderedFragments,
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

  if (arrangeVerseComplete || !currentQuestion) {
    return <Stage2FieldWaitingScreen title="انتهت أسئلة ترتيب الآيات" />;
  }

  return (
    <QuestionTransition questionKey={`stage2-arrange-q-${questionIndex}`}>
      <ArenaLayout
        question={
        <QuestionPrompt reference={currentQuestion.reference} imageUrl={currentQuestion.imageUrl} size="arena">
          {currentQuestion.prompt}
        </QuestionPrompt>
      }
      progress={
        <StepJourney
          current={questionIndex + 1}
          total={questionCount}
        />
      }
      board={
        <Stage2ArrangeVerseQuestionCard
          confirmed={confirmed}
          disabled={answeringClosed || saving}
          hideQuestion
          question={currentQuestion}
          saveError={saveError}
          saving={saving}
          shuffleSeed={shuffleSeed}
          onConfirm={(orderedFragments) => {
            void handleConfirm(orderedFragments);
          }}
        />
      }
    />
    </QuestionTransition>
  );
}
