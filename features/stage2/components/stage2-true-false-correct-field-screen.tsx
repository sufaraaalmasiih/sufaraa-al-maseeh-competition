"use client";

import { useEffect, useState } from "react";
import { ArenaLayout } from "@/components/competition/arena-layout";
import { StepJourney } from "@/components/competition/step-journey";
import { QuestionPrompt } from "@/components/competition/question-prompt";
import { EmptyState } from "@/components/layout/empty-state";
import { useCompetitionTimer } from "@/features/gameflow/use-competition-timer";
import { Stage2TrueFalseCorrectQuestionCard } from "@/features/stage2/components/stage2-true-false-correct-question-card";
import { confirmStage2TrueFalseCorrectAnswer } from "@/features/stage2/confirm-stage2-true-false-correct-answer";
import { STAGE2_QUESTION_ADVANCE_MS } from "@/features/stage2/stage2-constants";
import type { Stage2TrueFalseChoice } from "@/features/stage2/stage2-true-false-correct-types";
import {
  STAGE2_TRUE_FALSE_CORRECT_QUESTION_COUNT,
  stage2TrueFalseCorrectMockQuestions,
} from "@/features/stage2/stage2-true-false-correct-mock-questions";

interface Stage2TrueFalseCorrectFieldScreenProps {
  assignedPlayerName: string;
  trueFalseCorrectQuestionIndex: number;
}

export function Stage2TrueFalseCorrectFieldScreen({
  assignedPlayerName,
  trueFalseCorrectQuestionIndex,
}: Stage2TrueFalseCorrectFieldScreenProps) {
  const [questionIndex, setQuestionIndex] = useState(trueFalseCorrectQuestionIndex);
  const [selectedChoice, setSelectedChoice] = useState<Stage2TrueFalseChoice | null>(null);
  const [correctionText, setCorrectionText] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const { timer, remainingSeconds, isExpired } = useCompetitionTimer();

  const hasStage2AnsweringTimer = Boolean(
    timer?.active && timer.stage === "stage2" && timer.purpose === "answering",
  );
  const answeringClosed = Boolean(hasStage2AnsweringTimer && isExpired);
  const currentQuestion = stage2TrueFalseCorrectMockQuestions[questionIndex];
  const trueFalseCorrectComplete =
    questionIndex >= STAGE2_TRUE_FALSE_CORRECT_QUESTION_COUNT;

  useEffect(() => {
    setQuestionIndex(trueFalseCorrectQuestionIndex);
    setSelectedChoice(null);
    setCorrectionText("");
    setConfirmed(false);
    setSaveError(null);
  }, [trueFalseCorrectQuestionIndex]);

  useEffect(() => {
    setSelectedChoice(null);
    setCorrectionText("");
    setConfirmed(false);
    setSaveError(null);
  }, [questionIndex]);

  function goToNextQuestion() {
    setQuestionIndex((current) => current + 1);
    setSelectedChoice(null);
    setCorrectionText("");
    setConfirmed(false);
    setSaveError(null);
  }

  async function confirmTrueFalseCorrectAnswer() {
    if (
      answeringClosed ||
      confirmed ||
      saving ||
      !currentQuestion ||
      (selectedChoice !== "true" && selectedChoice !== "false")
    ) {
      return;
    }

    if (selectedChoice === "false" && !correctionText.trim()) {
      return;
    }

    setSaving(true);
    setSaveError(null);
    try {
      await confirmStage2TrueFalseCorrectAnswer({
        question: currentQuestion,
        questionIndex,
        selectedChoice,
        correctionText,
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

  if (trueFalseCorrectComplete || !currentQuestion) {
    return (
      <div className="arena-scene items-center justify-center">
        <p className="arena-question-text text-2xl sm:text-3xl">
          انتهت أسئلة صح أو خطأ، بانتظار توجيه الميسر
        </p>
      </div>
    );
  }

  return (
    <ArenaLayout
      question={
        <QuestionPrompt reference={currentQuestion.reference} size="arena">
          {currentQuestion.statement}
        </QuestionPrompt>
      }
      progress={
        <StepJourney
          current={questionIndex + 1}
          total={STAGE2_TRUE_FALSE_CORRECT_QUESTION_COUNT}
        />
      }
      board={
        <Stage2TrueFalseCorrectQuestionCard
          confirmed={confirmed}
          correctionText={correctionText}
          disabled={answeringClosed || saving}
          hideQuestion
          question={currentQuestion}
          saveError={saveError}
          saving={saving}
          selectedChoice={selectedChoice}
          onConfirm={() => {
            void confirmTrueFalseCorrectAnswer();
          }}
          onCorrectionChange={setCorrectionText}
          onSelectChoice={(choice) => {
            setSelectedChoice(choice);
            setSaveError(null);
            if (choice === "true") {
              setCorrectionText("");
            }
          }}
        />
      }
    />
  );
}
