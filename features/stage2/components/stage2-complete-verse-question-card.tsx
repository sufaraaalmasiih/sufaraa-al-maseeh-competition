"use client";

import { CompetitionConfirmButton } from "@/components/competition/competition-confirm-button";
import { QuestionPrompt } from "@/components/competition/question-prompt";
import type { Stage2CompleteVerseQuestion } from "@/features/stage2/stage2-complete-verse-types";

interface Stage2CompleteVerseQuestionCardProps {
  question: Stage2CompleteVerseQuestion;
  answerText: string;
  confirmed: boolean;
  saving: boolean;
  saveError: string | null;
  disabled: boolean;
  hideQuestion?: boolean;
  onAnswerTextChange: (value: string) => void;
  onConfirm: () => void;
}

export function Stage2CompleteVerseQuestionCard({
  question,
  answerText,
  confirmed,
  saving,
  saveError,
  disabled,
  hideQuestion = false,
  onAnswerTextChange,
  onConfirm,
}: Stage2CompleteVerseQuestionCardProps) {
  return (
    <div className="gameplay-answer-zone">
      {hideQuestion ? null : (
        <QuestionPrompt reference={question.reference} imageUrl={question.imageUrl} size="verse">
          {question.verseWithBlank}
        </QuestionPrompt>
      )}

      <div className="gameplay-answer-field">
        <input
          autoComplete="off"
          className="gameplay-answer-input"
          disabled={confirmed || disabled || saving}
          placeholder="اكتب الإكمال هنا"
          value={answerText}
          onChange={(event) => onAnswerTextChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && answerText.trim()) onConfirm();
          }}
        />
      </div>

      {!confirmed && saveError ? (
        <p className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-center text-sm font-bold text-destructive">
          {saveError}
        </p>
      ) : null}
      <CompetitionConfirmButton
        confirmed={confirmed}
        disabled={disabled || saving || !answerText.trim()}
        onClick={onConfirm}
      >
        {saving ? "جاري الحفظ..." : "تأكيد الإجابة"}
      </CompetitionConfirmButton>
    </div>
  );
}
