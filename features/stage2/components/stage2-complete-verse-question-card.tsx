"use client";

import { CompetitionAnswerSuccess } from "@/components/competition/competition-answer-success";
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
    <div className="space-y-3">
      {hideQuestion ? null : (
        <QuestionPrompt reference={question.reference} size="verse">
          {question.verseWithBlank}
        </QuestionPrompt>
      )}

      <input
        autoComplete="off"
        className="glass-input w-full"
        disabled={confirmed || disabled || saving}
        placeholder="اكتب الإكمال هنا"
        value={answerText}
        onChange={(event) => onAnswerTextChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && answerText.trim()) onConfirm();
        }}
      />

      {confirmed ? (
        <CompetitionAnswerSuccess />
      ) : (
        <>
          {saveError ? (
            <p className="glass-card px-3 py-2 text-sm font-bold text-destructive">{saveError}</p>
          ) : null}
          <CompetitionConfirmButton
            className="mx-auto"
            disabled={disabled || saving || !answerText.trim()}
            onClick={onConfirm}
          >
            {saving ? "جاري الحفظ..." : "تأكيد الإجابة"}
          </CompetitionConfirmButton>
        </>
      )}
    </div>
  );
}
