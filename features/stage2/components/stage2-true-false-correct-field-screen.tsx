"use client";

import { useEffect, useState } from "react";
import { ArenaLayout } from "@/components/competition/arena-layout";
import { StepJourney } from "@/components/competition/step-journey";
import { QuestionPrompt } from "@/components/competition/question-prompt";
import { QuestionTransition } from "@/components/motion/question-transition";
import { EmptyState } from "@/components/layout/empty-state";
import { useCompetitionTimer } from "@/features/gameflow/use-competition-timer";
import { Stage2TrueFalseCorrectQuestionCard } from "@/features/stage2/components/stage2-true-false-correct-question-card";
import { confirmStage2TrueFalseCorrectAnswer } from "@/features/stage2/confirm-stage2-true-false-correct-answer";
import type { Stage2TrueFalseChoice } from "@/features/stage2/stage2-true-false-correct-types";
import { getActiveStage2TrueFalseQuestions } from "@/features/facilitator/question-bank-runtime-cache";
import { Stage2FieldWaitingScreen } from "@/features/stage2/components/stage2-field-waiting-screen";
import { formatSaveErrorFromCode } from "@/lib/format-save-error";

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
  const [selectedWrongPart, setSelectedWrongPart] = useState("");
  const [correctionText, setCorrectionText] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const { timer, isSubmitExpired } = useCompetitionTimer();

  const hasStage2AnsweringTimer = Boolean(
    timer?.active && timer.stage === "stage2" && timer.purpose === "answering",
  );
  const answeringClosed = Boolean(hasStage2AnsweringTimer && isSubmitExpired);
  const trueFalseQuestions = getActiveStage2TrueFalseQuestions();
  const questionCount = trueFalseQuestions.length;
  const currentQuestion = trueFalseQuestions[questionIndex];
  const trueFalseCorrectComplete = questionIndex >= questionCount;

  useEffect(() => {
    setQuestionIndex(trueFalseCorrectQuestionIndex);
    setSelectedChoice(null);
    setSelectedWrongPart("");
    setCorrectionText("");
    setConfirmed(false);
    setSaveError(null);
  }, [trueFalseCorrectQuestionIndex]);

  useEffect(() => {
    setSelectedChoice(null);
    setSelectedWrongPart("");
    setCorrectionText("");
    setConfirmed(false);
    setSaveError(null);
  }, [questionIndex]);

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

    if (selectedChoice === "false" && (!correctionText.trim() || !selectedWrongPart.trim())) {
      return;
    }

    setSaving(true);
    setSaveError(null);
    try {
      await confirmStage2TrueFalseCorrectAnswer({
        question: currentQuestion,
        questionIndex,
        selectedChoice,
        selectedWrongPart,
        correctionText,
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

  if (trueFalseCorrectComplete || !currentQuestion) {
    return <Stage2FieldWaitingScreen title="انتهت أسئلة صح أو خطأ" />;
  }

  return (
    <QuestionTransition questionKey={`stage2-tf-q-${questionIndex}`}>
      <ArenaLayout
        question={
        <QuestionPrompt reference={currentQuestion.reference} imageUrl={currentQuestion.imageUrl} size="arena">
          {currentQuestion.statement}
        </QuestionPrompt>
      }
      progress={
        <StepJourney
          current={questionIndex + 1}
          total={questionCount}
        />
      }
      board={
        <Stage2TrueFalseCorrectQuestionCard
          confirmed={confirmed}
          correctionText={correctionText}
          selectedWrongPart={selectedWrongPart}
          disabled={answeringClosed || saving}
          hideQuestion
          question={currentQuestion}
          saveError={saveError}
          saving={saving}
          selectedChoice={selectedChoice}
          onConfirm={() => {
            void confirmTrueFalseCorrectAnswer();
          }}
          onWrongPartChange={setSelectedWrongPart}
          onCorrectionChange={setCorrectionText}
          onSelectChoice={(choice) => {
            setSelectedChoice(choice);
            setSaveError(null);
            if (choice === "true") {
              setSelectedWrongPart("");
              setCorrectionText("");
            }
          }}
        />
      }
    />
    </QuestionTransition>
  );
}
