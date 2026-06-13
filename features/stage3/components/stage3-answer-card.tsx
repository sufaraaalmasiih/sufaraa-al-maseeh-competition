"use client";

import { CheckCircle2 } from "lucide-react";
import { CompetitionConfirmButton } from "@/components/competition/competition-confirm-button";
import { cn } from "@/lib/utils";
import type { Stage3MockQuestion } from "@/features/stage3/stage3-mock-questions";

interface Stage3AnswerCardProps {
  question: Stage3MockQuestion;
  isOwner: boolean;
  selectedAnswer: string | null;
  confirmed: boolean;
  passed: boolean;
  saving: boolean;
  saveError: string | null;
  disabled: boolean;
  onSelectAnswer: (answer: string) => void;
  onConfirm: () => void;
  onPass?: () => void;
}

export function Stage3AnswerCard({
  question,
  isOwner,
  selectedAnswer,
  confirmed,
  passed,
  saving,
  saveError,
  disabled,
  onSelectAnswer,
  onConfirm,
  onPass,
}: Stage3AnswerCardProps) {
  return (
    <div className="stage3-answer-zone">
      <p className="mb-4 text-center text-lg font-black text-[#143A5A]">
        {isOwner ? "إجابة صاحب الدور" : "إجابتكم أو التجاوز"}
      </p>

      {disabled && !confirmed ? (
        <p className="mb-4 rounded-xl border border-[#2388C4]/20 bg-[#E9F6FC]/60 px-4 py-3 text-center text-sm font-bold text-[#143A5A]">
          انتهى وقت الإجابة — بانتظار الميسّر
        </p>
      ) : null}

      {!passed ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {question.options.map((option) => {
            const selected = selectedAnswer === option;

            return (
              <button
                key={option}
                type="button"
                className={cn(
                  "stage3-answer-choice",
                  selected && "stage3-answer-choice--selected",
                  (confirmed || saving || disabled) && "cursor-not-allowed opacity-70",
                )}
                disabled={confirmed || saving || disabled}
                onClick={() => onSelectAnswer(option)}
              >
                {option}
              </button>
            );
          })}
        </div>
      ) : null}

      {confirmed ? (
        <div className="mt-4 rounded-xl border border-[#4F8A10]/25 bg-[#F0FAE6] px-4 py-4 text-center text-base font-bold text-[#4F8A10]">
          <p className="flex items-center justify-center gap-2">
            <CheckCircle2 className="h-5 w-5" />
            {passed ? "تم تسجيل التجاوز" : "تم تأكيد الإجابة"}
          </p>
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          {saveError ? (
            <p className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-center text-sm font-bold text-destructive">
              {saveError}
            </p>
          ) : null}
          <CompetitionConfirmButton
            disabled={!selectedAnswer || saving || disabled}
            onClick={onConfirm}
          >
            {saving ? "جاري الحفظ..." : "تأكيد الإجابة"}
          </CompetitionConfirmButton>
          {!isOwner && onPass ? (
            <button
              type="button"
              className="w-full rounded-full border border-[#143A5A]/20 bg-white/80 px-6 py-3 text-base font-bold text-[#143A5A] transition hover:bg-[#EEF4F9] disabled:cursor-not-allowed disabled:opacity-50"
              disabled={saving || disabled}
              onClick={onPass}
            >
              {saving ? "جاري التسجيل..." : "تجاوز"}
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
}

