"use client";

import { useEffect, useMemo, useState } from "react";
import { CompetitionAnswerSuccess } from "@/components/competition/competition-answer-success";
import { CompetitionConfirmButton } from "@/components/competition/competition-confirm-button";
import { QuizChoiceCard } from "@/components/competition/quiz-choice-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  formatStage1ArrangeSubmission,
  getStage1ArrangeCorrectOrder,
  getStage1ArrangeDisplayParts,
} from "@/features/stage1/stage1-arrange";
import type { Stage1ArrangeQuestion } from "@/features/stage1/stage1-types";
import { getStage1QuestionTypeLabel } from "@/features/stage1/stage1-types";

interface Stage1ArrangeQuestionCardProps {
  question: Stage1ArrangeQuestion;
  questionNumber: number;
  totalQuestions: number;
  shuffleSeed: string;
  confirmed: boolean;
  saving: boolean;
  saveError: string | null;
  interactionOnly?: boolean;
  onConfirm: (answer: string) => void;
}

export function Stage1ArrangeQuestionCard({
  question,
  questionNumber,
  totalQuestions,
  shuffleSeed,
  confirmed,
  saving,
  saveError,
  interactionOnly = false,
  onConfirm,
}: Stage1ArrangeQuestionCardProps) {
  const expectedCount = getStage1ArrangeCorrectOrder(question).length;
  const [pickedIndices, setPickedIndices] = useState<number[]>([]);

  const displayParts = useMemo(
    () => getStage1ArrangeDisplayParts(question, shuffleSeed),
    [question, shuffleSeed],
  );

  const picked = useMemo(
    () => pickedIndices.map((index) => displayParts[index]),
    [pickedIndices, displayParts],
  );

  useEffect(() => {
    setPickedIndices([]);
  }, [question.id]);

  function togglePart(displayIndex: number) {
    if (confirmed || saving) {
      return;
    }

    setPickedIndices((current) => {
      const existingIndex = current.indexOf(displayIndex);
      if (existingIndex >= 0) {
        return current.filter((_, index) => index !== existingIndex);
      }

      if (current.length >= expectedCount) {
        return current;
      }

      return [...current, displayIndex];
    });
  }

  function resetOrder() {
    if (confirmed || saving) {
      return;
    }

    setPickedIndices([]);
  }

  const ready = pickedIndices.length === expectedCount;

  const body = (
    <div className="gameplay-arrange-zone">
      <div className="quiz-picked-strip" dir="rtl">
        <div className="flex min-h-8 flex-wrap items-center justify-center gap-1.5">
          {picked.length > 0 ? (
            picked.map((value, index) => (
              <span
                key={`${question.id}-picked-${pickedIndices[index]}-${index}`}
                className="quiz-picked-chip"
              >
                <span aria-hidden className="quiz-picked-chip-index">
                  {index + 1}
                </span>
                {value}
              </span>
            ))
          ) : (
            <span className="text-xs font-semibold text-[#143A5A]/40">اختر الكلمات بالترتيب</span>
          )}
        </div>
      </div>

      <div
        className={cn(
          "quiz-choice-grid",
          displayParts.length >= 5 ? "quiz-choice-grid--five" : "quiz-choice-grid--four",
        )}
      >
        {displayParts.map((part, index) => {
          const selected = pickedIndices.includes(index);

          return (
            <QuizChoiceCard
              key={`${question.id}-arrange-${index}`}
              disabled={confirmed || saving}
              selected={selected}
              onClick={() => togglePart(index)}
            >
              {part}
            </QuizChoiceCard>
          );
        })}
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
          <CompetitionConfirmButton
            disabled={!ready || saving}
            onClick={() => onConfirm(formatStage1ArrangeSubmission(picked))}
          >
            {saving ? "جاري الحفظ..." : "تأكيد الترتيب"}
          </CompetitionConfirmButton>
          <button
            className="text-center text-xs font-bold text-[#143A5A]/50 transition-colors hover:text-[#2388C4] disabled:opacity-40"
            disabled={confirmed || saving || pickedIndices.length === 0}
            type="button"
            onClick={resetOrder}
          >
            إعادة الترتيب
          </button>
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
          السؤال {questionNumber} من {totalQuestions} · {getStage1QuestionTypeLabel("arrange")}
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
