"use client";

import { useState } from "react";
import { ChoiceCard } from "@/components/competition/choice-card";
import { CompetitionConfirmButton } from "@/components/competition/competition-confirm-button";
import { QuestionPrompt } from "@/components/competition/question-prompt";
import type {
  Stage2TrueFalseChoice,
  Stage2TrueFalseCorrectQuestion,
} from "@/features/stage2/stage2-true-false-correct-types";

interface Stage2TrueFalseCorrectQuestionCardProps {
  question: Stage2TrueFalseCorrectQuestion;
  selectedChoice: Stage2TrueFalseChoice | null;
  correctionText: string;
  confirmed: boolean;
  saving: boolean;
  saveError: string | null;
  disabled: boolean;
  hideQuestion?: boolean;
  onSelectChoice: (choice: Stage2TrueFalseChoice) => void;
  onCorrectionChange: (value: string) => void;
  onConfirm: () => void;
}

export function Stage2TrueFalseCorrectQuestionCard({
  question,
  selectedChoice,
  correctionText,
  confirmed,
  saving,
  saveError,
  disabled,
  hideQuestion = false,
  onSelectChoice,
  onCorrectionChange,
  onConfirm,
}: Stage2TrueFalseCorrectQuestionCardProps) {
  const [validationError, setValidationError] = useState<string | null>(null);
  const showCorrectionInput = selectedChoice === "false";
  const isLocked = confirmed || disabled || saving;

  function handleConfirmClick() {
    if (isLocked) return;
    if (selectedChoice !== "true" && selectedChoice !== "false") {
      setValidationError("اختر صح أو خطأ أولاً");
      return;
    }
    if (selectedChoice === "false" && !correctionText.trim()) {
      setValidationError("اكتب التصحيح أولاً");
      return;
    }
    setValidationError(null);
    onConfirm();
  }

  function handleSelectChoice(choice: Stage2TrueFalseChoice) {
    setValidationError(null);
    onSelectChoice(choice);
  }

  return (
    <div className="space-y-3">
      {hideQuestion ? null : (
        <QuestionPrompt reference={question.reference} imageUrl={question.imageUrl} size="hero">
          {question.statement}
        </QuestionPrompt>
      )}

      <div className="mx-auto grid w-full max-w-lg grid-cols-2 gap-3">
        {(
          [
            { choice: "true" as const, label: "صح", symbol: "✓", variant: "true" as const },
            { choice: "false" as const, label: "خطأ", symbol: "✗", variant: "false" as const },
          ] as const
        ).map(({ choice, label, symbol, variant }) => (
          <ChoiceCard
            key={`${question.id}-${choice}`}
            disabled={isLocked}
            selected={selectedChoice === choice}
            variant={variant}
            onClick={() => handleSelectChoice(choice)}
          >
            <span aria-hidden className="text-4xl font-black leading-none sm:text-5xl">
              {symbol}
            </span>
            {label}
          </ChoiceCard>
        ))}
      </div>

      <div className="gameplay-answer-zone">
        {showCorrectionInput ? (
          <div className="gameplay-answer-field">
            <textarea
              id={`correction-${question.id}`}
              className="gameplay-answer-input min-h-20 resize-none py-3 leading-8"
              disabled={isLocked}
              placeholder="اكتب التصحيح"
              value={correctionText}
              onChange={(event) => {
                setValidationError(null);
                onCorrectionChange(event.target.value);
              }}
            />
          </div>
        ) : null}

        {!confirmed && saveError ? (
          <p className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-center text-sm font-bold text-destructive">
            {saveError}
          </p>
        ) : null}
        {!confirmed && validationError ? (
          <p className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-center text-sm font-bold text-destructive">
            {validationError}
          </p>
        ) : null}
        <CompetitionConfirmButton confirmed={confirmed} disabled={disabled || saving} onClick={handleConfirmClick}>
          {saving ? "جاري الحفظ..." : "تأكيد الإجابة"}
        </CompetitionConfirmButton>
      </div>
    </div>
  );
}
