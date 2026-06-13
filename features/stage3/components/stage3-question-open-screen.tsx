"use client";

import { Stage3GameplayHeader } from "@/features/stage3/components/stage3-gameplay-header";
import { getStage3MockQuestion } from "@/features/stage3/stage3-mock-questions";
import {
  STAGE3_DIFFICULTY_LABELS,
  STAGE3_OWNER_TEAM_PLACEHOLDER,
  type Stage3QuestionMetadata,
} from "@/features/stage3/stage3-question-types";

export type Stage3QuestionOpenVariant = "team" | "audience" | "facilitator";

interface Stage3QuestionOpenScreenProps {
  question: Stage3QuestionMetadata | null;
  ownerTeamName?: string | null;
  variant?: Stage3QuestionOpenVariant;
}

export function Stage3QuestionOpenScreen({
  question,
  ownerTeamName,
  variant = "team",
}: Stage3QuestionOpenScreenProps) {
  if (!question) {
    return (
      <div className="stage3-question-hero">
        <p className="stage3-question-hero__title">على المحك</p>
        <p className="stage3-question-hero__prompt text-xl">لا يوجد تحدٍ نشط</p>
      </div>
    );
  }

  const mockQuestion = getStage3MockQuestion(question.id);
  const ownerLabel = ownerTeamName || STAGE3_OWNER_TEAM_PLACEHOLDER;

  return (
    <div className="stage3-scene">
      <Stage3GameplayHeader
        ownerTeamName={ownerLabel}
        fieldLabel={question.fieldLabel}
        questionNumber={question.questionNumber}
        difficulty={question.difficulty}
      />

      <div className="stage3-question-hero">
        <p className="stage3-question-hero__title">التحدي</p>
        <p className="stage3-question-hero__field">
          {question.fieldLabel} · س{question.questionNumber} ·{" "}
          {STAGE3_DIFFICULTY_LABELS[question.difficulty]}
        </p>
        <p className="stage3-question-hero__prompt">{mockQuestion?.prompt ?? "—"}</p>
        {variant === "audience" ? (
          <p className="mt-4 text-sm font-semibold text-[#143A5A]/60">
            شاشة العرض — الإجابات تُعلن لاحقاً.
          </p>
        ) : variant === "facilitator" ? (
          <p className="mt-4 text-sm font-semibold text-[#143A5A]/60">
            مركز التحكم — راقب إجابات الفرق أدناه.
          </p>
        ) : null}
      </div>
    </div>
  );
}

