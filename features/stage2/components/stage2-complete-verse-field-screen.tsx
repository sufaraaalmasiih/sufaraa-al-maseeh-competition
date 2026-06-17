"use client";

import { useEffect, useState } from "react";
import { ArenaLayout } from "@/components/competition/arena-layout";
import { StepJourney } from "@/components/competition/step-journey";
import { QuestionPrompt } from "@/components/competition/question-prompt";
import { QuestionTransition } from "@/components/motion/question-transition";
import { EmptyState } from "@/components/layout/empty-state";
import { useCompetitionTimer } from "@/features/gameflow/use-competition-timer";
import { Stage2CompleteVerseQuestionCard } from "@/features/stage2/components/stage2-complete-verse-question-card";
import { confirmStage2CompleteVerseAnswer } from "@/features/stage2/confirm-stage2-complete-verse-answer";
import { getActiveStage2CompleteVerseQuestions } from "@/features/facilitator/question-bank-runtime-cache";
import { Stage2FieldWaitingScreen } from "@/features/stage2/components/stage2-field-waiting-screen";

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
  const completeVerseQuestions = getActiveStage2CompleteVerseQuestions();
  const questionCount = completeVerseQuestions.length;
  const currentQuestion = completeVerseQuestions[questionIndex];
  const completeVerseComplete = questionIndex >= questionCount;

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
    } catch {
      setSaveError("تعذر حفظ الإجابة. تحقق من الاتصال وحاول مرة أخرى.");
      setSaving(false);
    }
  }

  if (answeringClosed) {
    return <EmptyState title="انتهى وقت الإجابة، بانتظار توجيه الميسر" />;
  }

  if (completeVerseComplete || !currentQuestion) {
    return <Stage2FieldWaitingScreen title="انتهت أسئلة إكمال الآيات" />;
  }

  return (
    <QuestionTransition questionKey={`stage2-complete-q-${questionIndex}`}>
      <ArenaLayout
        question={
        <QuestionPrompt reference={currentQuestion.reference} imageUrl={currentQuestion.imageUrl} size="arena-verse">
          {currentQuestion.verseWithBlank}
        </QuestionPrompt>
      }
      progress={
        <StepJourney
          current={questionIndex + 1}
          total={questionCount}
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
    </QuestionTransition>
  );
}
