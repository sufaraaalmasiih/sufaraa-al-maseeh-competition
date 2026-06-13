"use client";

import { Stage1ArrangeQuestionCard } from "@/features/stage1/components/stage1-arrange-question-card";
import { Stage1ChoiceQuestionCard } from "@/features/stage1/components/stage1-choice-question-card";
import { Stage1TextQuestionCard } from "@/features/stage1/components/stage1-text-question-card";
import type { Stage1MockQuestion } from "@/features/stage1/stage1-types";

interface Stage1QuestionCardProps {
  question: Stage1MockQuestion;
  questionNumber: number;
  totalQuestions: number;
  arrangeShuffleSeed: string;
  selectedAnswer: string | null;
  answerText: string;
  confirmed: boolean;
  saving: boolean;
  saveError: string | null;
  interactionOnly?: boolean;
  onSelectAnswer: (answer: string) => void;
  onAnswerTextChange: (value: string) => void;
  onConfirm: (answer?: string) => void;
}

export function Stage1QuestionCard({
  question,
  questionNumber,
  totalQuestions,
  arrangeShuffleSeed,
  selectedAnswer,
  answerText,
  confirmed,
  saving,
  saveError,
  interactionOnly = false,
  onSelectAnswer,
  onAnswerTextChange,
  onConfirm,
}: Stage1QuestionCardProps) {
  if (question.type === "arrange") {
    return (
      <Stage1ArrangeQuestionCard
        confirmed={confirmed}
        question={question}
        questionNumber={questionNumber}
        saveError={saveError}
        saving={saving}
        interactionOnly={interactionOnly}
        shuffleSeed={arrangeShuffleSeed}
        totalQuestions={totalQuestions}
        onConfirm={(answer) => onConfirm(answer)}
      />
    );
  }

  if (question.type === "missing" || question.type === "fill_blank") {
    return (
      <Stage1TextQuestionCard
        answerText={answerText}
        confirmed={confirmed}
        question={question}
        questionNumber={questionNumber}
        interactionOnly={interactionOnly}
        saveError={saveError}
        saving={saving}
        totalQuestions={totalQuestions}
        onAnswerTextChange={onAnswerTextChange}
        onConfirm={() => onConfirm(answerText.trim())}
      />
    );
  }

  return (
    <Stage1ChoiceQuestionCard
      confirmed={confirmed}
      question={question}
      questionNumber={questionNumber}
      interactionOnly={interactionOnly}
      saveError={saveError}
      saving={saving}
      selectedAnswer={selectedAnswer}
      totalQuestions={totalQuestions}
      onConfirm={() => {
        if (selectedAnswer) {
          onConfirm(selectedAnswer);
        }
      }}
      onSelectAnswer={onSelectAnswer}
    />
  );
}
