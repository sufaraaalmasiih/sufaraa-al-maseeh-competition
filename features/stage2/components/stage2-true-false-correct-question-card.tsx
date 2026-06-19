"use client";

import { useEffect, useMemo, useState } from "react";
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
  selectedWrongPart: string;
  correctionText: string;
  confirmed: boolean;
  saving: boolean;
  saveError: string | null;
  disabled: boolean;
  hideQuestion?: boolean;
  onSelectChoice: (choice: Stage2TrueFalseChoice) => void;
  onWrongPartChange: (value: string) => void;
  onCorrectionChange: (value: string) => void;
  onConfirm: () => void;
}

/** يقسّم الجملة إلى كلمات قابلة للنقر مع الحفاظ على الترتيب. */
function tokenizeStatement(statement: string): string[] {
  return statement.split(/\s+/).filter((word) => word.length > 0);
}

export function Stage2TrueFalseCorrectQuestionCard({
  question,
  selectedChoice,
  selectedWrongPart,
  correctionText,
  confirmed,
  saving,
  saveError,
  disabled,
  hideQuestion = false,
  onSelectChoice,
  onWrongPartChange,
  onCorrectionChange,
  onConfirm,
}: Stage2TrueFalseCorrectQuestionCardProps) {
  const [validationError, setValidationError] = useState<string | null>(null);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const showCorrectionInput = selectedChoice === "false";
  const isLocked = confirmed || disabled || saving;

  const tokens = useMemo(() => tokenizeStatement(question.statement), [question.statement]);

  // إعادة الضبط عند تغيّر السؤال أو عند العودة لاختيار «صح».
  useEffect(() => {
    setSelectedIndices([]);
  }, [question.id]);

  useEffect(() => {
    if (selectedChoice !== "false") {
      setSelectedIndices([]);
    }
  }, [selectedChoice]);

  function toggleToken(index: number) {
    if (isLocked) return;
    setValidationError(null);
    setSelectedIndices((current) => {
      const next = current.includes(index)
        ? current.filter((value) => value !== index)
        : [...current, index].sort((a, b) => a - b);
      onWrongPartChange(next.map((tokenIndex) => tokens[tokenIndex]).join(" "));
      return next;
    });
  }

  function handleConfirmClick() {
    if (isLocked) return;
    if (selectedChoice !== "true" && selectedChoice !== "false") {
      setValidationError("اختر صح أو خطأ أولاً");
      return;
    }
    if (selectedChoice === "false" && !selectedWrongPart.trim()) {
      setValidationError("حدّد الجزء الخطأ من الجملة أولاً");
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
    <div className={showCorrectionInput ? "space-y-2" : "space-y-3"}>
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
            className={showCorrectionInput ? "stage2-tf-choice--compact" : undefined}
            onClick={() => handleSelectChoice(choice)}
          >
            <span
              aria-hidden
              className={
                showCorrectionInput
                  ? "text-2xl font-black leading-none sm:text-3xl"
                  : "text-4xl font-black leading-none sm:text-5xl"
              }
            >
              {symbol}
            </span>
            {label}
          </ChoiceCard>
        ))}
      </div>

      <div className="gameplay-answer-zone">
        {showCorrectionInput ? (
          <>
            <div className="stage2-wrong-part">
              <p className="stage2-wrong-part__hint">
                اضغط على الكلمة (أو أكثر) الخطأ في الجملة:
              </p>
              <div className="stage2-wrong-part__tokens" dir="rtl">
                {tokens.map((word, index) => (
                  <button
                    key={`${question.id}-token-${index}`}
                    type="button"
                    disabled={isLocked}
                    aria-pressed={selectedIndices.includes(index)}
                    className={`stage2-wrong-part__token${
                      selectedIndices.includes(index) ? " stage2-wrong-part__token--selected" : ""
                    }`}
                    onClick={() => toggleToken(index)}
                  >
                    {word}
                  </button>
                ))}
              </div>
            </div>

            <div className="gameplay-answer-field">
              <textarea
                id={`correction-${question.id}`}
                className="gameplay-answer-input min-h-14 resize-none py-2 leading-7"
                disabled={isLocked}
                placeholder="اكتب التصحيح"
                value={correctionText}
                onChange={(event) => {
                  setValidationError(null);
                  onCorrectionChange(event.target.value);
                }}
                onKeyDown={(event) => {
                  // Enter يؤكّد الإجابة (Shift+Enter لسطر جديد) بدل تمرير الصفحة.
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    handleConfirmClick();
                  }
                }}
              />
            </div>
          </>
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
