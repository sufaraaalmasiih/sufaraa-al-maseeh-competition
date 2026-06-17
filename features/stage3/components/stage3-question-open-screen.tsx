"use client";

import { QuestionImage } from "@/components/competition/question-image";
import { Stage3GameplayHeader } from "@/features/stage3/components/stage3-gameplay-header";
import { getStage3MockQuestion } from "@/features/stage3/stage3-mock-questions";
import {
  STAGE3_OWNER_TEAM_PLACEHOLDER,
  type Stage3QuestionMetadata,
} from "@/features/stage3/stage3-question-types";

export type Stage3QuestionOpenVariant = "team" | "audience" | "facilitator";

interface Stage3QuestionOpenScreenProps {
  question: Stage3QuestionMetadata | null;
  ownerTeamName?: string | null;
  variant?: Stage3QuestionOpenVariant;
  hideHeader?: boolean;
  showAudienceNote?: boolean;
}

export function Stage3QuestionOpenScreen({
  question,
  ownerTeamName,
  variant = "team",
  hideHeader = false,
  showAudienceNote = true,
}: Stage3QuestionOpenScreenProps) {
  if (!question) {
    return (
      <div className="stage3-question-hero">
        <p className="stage3-question-hero__prompt text-xl">لا يوجد تحدٍ نشط</p>
      </div>
    );
  }

  const mockQuestion = getStage3MockQuestion(question.id);
  const ownerLabel = ownerTeamName || STAGE3_OWNER_TEAM_PLACEHOLDER;
  const displayPrompt =
    mockQuestion && variant === "team" && mockQuestion.prompt.includes(question.id)
      ? `السؤال ${question.questionNumber}`
      : mockQuestion?.prompt ?? "—";

  return (
    <>
      {!hideHeader ? (
        <Stage3GameplayHeader
          ownerTeamName={ownerLabel}
          fieldLabel={question.fieldLabel}
          questionNumber={question.questionNumber}
          difficulty={question.difficulty}
        />
      ) : null}

      <div className="stage3-question-hero stage3-question-hero--prompt-only">
        <p className="stage3-question-hero__prompt">{displayPrompt}</p>
        <QuestionImage url={mockQuestion?.imageUrl} className="mt-4" />
        {variant === "audience" && showAudienceNote ? (
          <p className="stage3-question-hero__audience-note">
            شاشة العرض — الإجابات تُعلن لاحقاً
          </p>
        ) : variant === "facilitator" ? (
          <p className="mt-4 text-sm font-semibold text-[#143A5A]/70">
            مركز التحكم — راقب إجابات الفرق أدناه.
          </p>
        ) : null}
      </div>
    </>
  );
}

