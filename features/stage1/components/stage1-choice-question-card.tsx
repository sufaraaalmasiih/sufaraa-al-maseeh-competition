"use client";

import { CompetitionAnswerSuccess } from "@/components/competition/competition-answer-success";
import { CompetitionConfirmButton } from "@/components/competition/competition-confirm-button";
import { QuizChoiceCard } from "@/components/competition/quiz-choice-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Stage1ChoiceQuestion } from "@/features/stage1/stage1-types";
import { getStage1QuestionTypeLabel } from "@/features/stage1/stage1-types";

interface Stage1ChoiceQuestionCardProps {
  question: Stage1ChoiceQuestion;
  questionNumber: number;
  totalQuestions: number;
  selectedAnswer: string | null;
  confirmed: boolean;
  saving: boolean;
  saveError: string | null;
  interactionOnly?: boolean;
  onSelectAnswer: (answer: string) => void;
  onConfirm: () => void;
}

export function Stage1ChoiceQuestionCard({
  question,
  questionNumber,
  totalQuestions,
  selectedAnswer,
  confirmed,
  saving,
  saveError,
  interactionOnly = false,
  onSelectAnswer,
  onConfirm,
}: Stage1ChoiceQuestionCardProps) {
  const body = (
    <div className="gameplay-mc-choice-zone">
      <div className={cn("quiz-choice-grid", selectedAnswer && "quiz-choice-grid--has-picks")}>
        {question.options.map((option, index) => (
          <QuizChoiceCard
            key={`${question.id}-${option}-${index}`}
            disabled={confirmed || saving}
            selected={selectedAnswer === option}
            onClick={() => onSelectAnswer(option)}
          >
            {option}
          </QuizChoiceCard>
        ))}
      </div>

      {confirmed ? (
        <CompetitionAnswerSuccess />
      ) : (
        <>
          {saveError ? (
            <p className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-center text-sm font-bold text-destructive">
              {saveError}
            </p>
          ) : null}
          <CompetitionConfirmButton disabled={!selectedAnswer || saving} onClick={onConfirm}>
            {saving ? "جاري الحفظ..." : "تأكيد الإجابة"}
          </CompetitionConfirmButton>
        </>
      )}
    </div>
  );

  if (interactionOnly) {
    return body;
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardDescription>
          السؤال {questionNumber} من {totalQuestions} ·{" "}
          {getStage1QuestionTypeLabel("multiple_choice")}
        </CardDescription>
        <CardTitle className="text-[#143A5A]">{question.prompt}</CardTitle>
        {question.reference ? (
          <p className="text-sm font-semibold text-[#4F8A10]">{question.reference}</p>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-5">{body}</CardContent>
    </Card>
  );
}
