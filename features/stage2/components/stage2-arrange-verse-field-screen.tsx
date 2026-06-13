"use client";

import { useEffect, useMemo, useState } from "react";
import { ArenaLayout } from "@/components/competition/arena-layout";
import { StepJourney } from "@/components/competition/step-journey";
import { QuestionPrompt } from "@/components/competition/question-prompt";
import { EmptyState } from "@/components/layout/empty-state";
import { useCompetitionTimer } from "@/features/gameflow/use-competition-timer";
import { Stage2ArrangeVerseQuestionCard } from "@/features/stage2/components/stage2-arrange-verse-question-card";
import { confirmStage2ArrangeVerseAnswer } from "@/features/stage2/confirm-stage2-arrange-verse-answer";
import { STAGE2_QUESTION_ADVANCE_MS } from "@/features/stage2/stage2-constants";
import {
  STAGE2_ARRANGE_VERSE_QUESTION_COUNT,
  stage2ArrangeVerseMockQuestions,
} from "@/features/stage2/stage2-arrange-verse-mock-questions";

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
  const { timer, remainingSeconds, isExpired } = useCompetitionTimer();

  const hasStage2AnsweringTimer = Boolean(
    timer?.active && timer.stage === "stage2" && timer.purpose === "answering",
  );
  const answeringClosed = Boolean(hasStage2AnsweringTimer && isExpired);
  const currentQuestion = stage2ArrangeVerseMockQuestions[questionIndex];
  const arrangeVerseComplete = questionIndex >= STAGE2_ARRANGE_VERSE_QUESTION_COUNT;

  const shuffleSeed = useMemo(
    () => `${teamId ?? "team"}|${currentQuestion?.id ?? questionIndex}`,
    [teamId, currentQuestion?.id, questionIndex],
  );

  useEffect(() => {
    setQuestionIndex(arrangeVerseQuestionIndex);
    setConfirmed(false);
    setSaveError(null);
  }, [arrangeVerseQuestionIndex]);

  function goToNextQuestion() {
    setQuestionIndex((current) => current + 1);
    setConfirmed(false);
    setSaveError(null);
  }

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
      window.setTimeout(goToNextQuestion, STAGE2_QUESTION_ADVANCE_MS);
    } catch {
      setSaveError("تعذر حفظ الإجابة. تحقق من الاتصال وحاول مرة أخرى.");
      setSaving(false);
    }
  }

  if (answeringClosed) {
    return <EmptyState title="انتهى وقت الإجابة، بانتظار توجيه الميسر" />;
  }

  if (arrangeVerseComplete || !currentQuestion) {
    return (
      <div className="arena-scene items-center justify-center">
        <p className="arena-question-text text-2xl sm:text-3xl">
          انتهت أسئلة ترتيب الآيات، بانتظار توجيه الميسر
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
        <StepJourney
          current={questionIndex + 1}
          total={STAGE2_ARRANGE_VERSE_QUESTION_COUNT}
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
  );
}
