"use client";

import { CompetitionAnswerSuccess } from "@/components/competition/competition-answer-success";
import { CompetitionConfirmButton } from "@/components/competition/competition-confirm-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Stage1FillBlankQuestion, Stage1MissingQuestion } from "@/features/stage1/stage1-types";
import { getStage1QuestionTypeLabel } from "@/features/stage1/stage1-types";

interface Stage1TextQuestionCardProps {
  question: Stage1MissingQuestion | Stage1FillBlankQuestion;
  questionNumber: number;
  totalQuestions: number;
  answerText: string;
  confirmed: boolean;
  saving: boolean;
  saveError: string | null;
  interactionOnly?: boolean;
  onAnswerTextChange: (value: string) => void;
  onConfirm: () => void;
}

export function Stage1TextQuestionCard({
  question,
  questionNumber,
  totalQuestions,
  answerText,
  confirmed,
  saving,
  saveError,
  interactionOnly = false,
  onAnswerTextChange,
  onConfirm,
}: Stage1TextQuestionCardProps) {
  const body = (
    <div className="gameplay-answer-zone">
      <div className="gameplay-answer-field">
        <input
          autoComplete="off"
          className="gameplay-answer-input"
          disabled={confirmed || saving}
          placeholder="اكتب إجابتك هنا"
          value={answerText}
          onChange={(event) => onAnswerTextChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && answerText.trim()) {
              onConfirm();
            }
          }}
        />
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
          <CompetitionConfirmButton disabled={!answerText.trim() || saving} onClick={onConfirm}>
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
          السؤال {questionNumber} من {totalQuestions} · {getStage1QuestionTypeLabel(question.type)}
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
