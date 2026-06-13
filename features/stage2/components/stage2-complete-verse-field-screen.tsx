"use client";

import { useEffect, useState } from "react";
import { ArenaLayout } from "@/components/competition/arena-layout";
import { StepJourney } from "@/components/competition/step-journey";
import { QuestionPrompt } from "@/components/competition/question-prompt";
import { EmptyState } from "@/components/layout/empty-state";
import { useCompetitionTimer } from "@/features/gameflow/use-competition-timer";
import { Stage2CompleteVerseQuestionCard } from "@/features/stage2/components/stage2-complete-verse-question-card";
import { confirmStage2CompleteVerseAnswer } from "@/features/stage2/confirm-stage2-complete-verse-answer";
import { STAGE2_QUESTION_ADVANCE_MS } from "@/features/stage2/stage2-constants";
import {
  STAGE2_COMPLETE_VERSE_QUESTION_COUNT,
  stage2CompleteVerseMockQuestions,
} from "@/features/stage2/stage2-complete-verse-mock-questions";

interface Stage2CompleteVerseFieldScreenProps {
  assignedPlayerName: string;
  completeVerseQuestionIndex: number;
}

export function Stage2CompleteVerseFieldScreen({
  assignedPlayerName,
  completeVerseQuestionIndex,
}: Stage2CompleteVerseFieldScreenProps) {
  const [questionIndex, setQuestionIndex] = useState(completeVerseQuestionIndex);
  const [answerText, setAnswerText] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const { timer, remainingSeconds, isExpired } = useCompetitionTimer();

  const hasStage2AnsweringTimer = Boolean(
    timer?.active && timer.stage === "stage2" && timer.purpose === "answering",
  );
  const answeringClosed = Boolean(hasStage2AnsweringTimer && isExpired);
  const currentQuestion = stage2CompleteVerseMockQuestions[questionIndex];
  const completeVerseComplete = questionIndex >= STAGE2_COMPLETE_VERSE_QUESTION_COUNT;

  useEffect(() => {
    setQuestionIndex(completeVerseQuestionIndex);
    setAnswerText("");
    setConfirmed(false);
    setSaveError(null);
  }, [completeVerseQuestionIndex]);

  useEffect(() => {
    setAnswerText("");
    setConfirmed(false);
    setSaveError(null);
  }, [questionIndex]);

  function goToNextQuestion() {
    setQuestionIndex((current) => current + 1);
    setAnswerText("");
    setConfirmed(false);
    setSaveError(null);
  }

  async function confirmCompleteVerseAnswer() {
    if (
      answeringClosed ||
      confirmed ||
      saving ||
      !currentQuestion ||
      !answerText.trim()
    ) {
      return;
    }

    setSaving(true);
    setSaveError(null);
    try {
      await confirmStage2CompleteVerseAnswer({
        question: currentQuestion,
        questionIndex,
        answer: answerText.trim(),
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

  if (completeVerseComplete || !currentQuestion) {
    return (
      <div className="arena-scene items-center justify-center">
        <p className="arena-question-text text-2xl sm:text-3xl">
          انتهت أسئلة إكمال الآيات، بانتظار توجيه الميسر
        </p>
      </div>
    );
  }

  return (
    <ArenaLayout
      question={
        <QuestionPrompt reference={currentQuestion.reference} size="arena-verse">
          {currentQuestion.verseWithBlank}
        </QuestionPrompt>
      }
      progress={
        <StepJourney
          current={questionIndex + 1}
          total={STAGE2_COMPLETE_VERSE_QUESTION_COUNT}
        />
      }
      board={
        <Stage2CompleteVerseQuestionCard
          answerText={answerText}
          confirmed={confirmed}
          disabled={answeringClosed || saving}
          hideQuestion
          question={currentQuestion}
          saveError={saveError}
          saving={saving}
          onAnswerTextChange={setAnswerText}
          onConfirm={() => {
            void confirmCompleteVerseAnswer();
          }}
        />
      }
    />
  );
}
