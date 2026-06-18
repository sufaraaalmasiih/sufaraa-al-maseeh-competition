"use client";

import { QuestionImage } from "@/components/competition/question-image";
import { QuestionTransition } from "@/components/motion/question-transition";
import { Stage3GameplayHeader } from "@/features/stage3/components/stage3-gameplay-header";
import { getStage3MockQuestion } from "@/features/stage3/stage3-mock-questions";
import { getStage1QuestionTypeLabel } from "@/features/stage1/stage1-types";
import {
  STAGE3_DIFFICULTY_LABELS,
  STAGE3_OWNER_TEAM_PLACEHOLDER,
  type Stage3QuestionMetadata,
} from "@/features/stage3/stage3-question-types";
import type { Stage3MockQuestion } from "@/features/stage3/stage3-mock-questions";

export type Stage3QuestionOpenVariant = "team" | "audience" | "facilitator";

interface Stage3QuestionOpenScreenProps {
  question: Stage3QuestionMetadata | null;
  ownerTeamName?: string | null;
  variant?: Stage3QuestionOpenVariant;
  hideHeader?: boolean;
  showAudienceNote?: boolean;
}

function getFacilitatorPromptLabel(
  question: Stage3QuestionMetadata,
  mockQuestion: Stage3MockQuestion | null,
): string {
  if (!mockQuestion) {
    return `سؤال ${question.questionNumber} — ${question.fieldLabel}`;
  }

  const typeLabel = getStage1QuestionTypeLabel(mockQuestion.type);
  let prompt = mockQuestion.prompt.trim();

  if (prompt.includes(question.id)) {
    prompt = prompt
      .replaceAll(question.id, "")
      .replace(/\(\s*\)/g, "")
      .replace(/\s*[·—-]\s*$/u, "")
      .trim();
  }

  const mockPrefix = `(${question.fieldLabel}) سؤال ${question.questionNumber}:`;
  if (prompt.startsWith(mockPrefix)) {
    prompt = prompt.slice(mockPrefix.length).trim();
  }

  if (!prompt || prompt === typeLabel) {
    return typeLabel;
  }

  if (prompt.endsWith(`— ${typeLabel}`) || prompt.endsWith(` - ${typeLabel}`)) {
    return typeLabel;
  }

  return prompt;
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
  const isFacilitator = variant === "facilitator";
  const displayPrompt =
    isFacilitator
      ? getFacilitatorPromptLabel(question, mockQuestion)
      : mockQuestion && variant === "team" && mockQuestion.prompt.includes(question.id)
        ? `السؤال ${question.questionNumber}`
        : mockQuestion?.prompt ?? "—";

  const selectionPill = isFacilitator
    ? `سؤال ${question.questionNumber} · ${question.fieldLabel} · ${STAGE3_DIFFICULTY_LABELS[question.difficulty]}`
    : `اختار فريق ${ownerLabel} سؤال ${question.questionNumber} من ${question.fieldLabel}`;

  return (
    <QuestionTransition questionKey={`stage3-selection-${question.id}`}>
      {!hideHeader ? (
        <Stage3GameplayHeader
          ownerTeamName={ownerLabel}
          fieldLabel={question.fieldLabel}
          questionNumber={question.questionNumber}
          difficulty={question.difficulty}
          showOwner={!isFacilitator}
        />
      ) : null}

      <div
        className={isFacilitator ? "stage3-selection-pill stage3-selection-pill--facilitator" : "stage3-selection-pill"}
        role="status"
        aria-live="polite"
      >
        {selectionPill}
      </div>

      <div
        className={
          isFacilitator
            ? "stage3-question-hero stage3-question-hero--prompt-only stage3-question-hero--facilitator"
            : "stage3-question-hero stage3-question-hero--prompt-only"
        }
      >
        {isFacilitator && mockQuestion ? (
          <p className="stage3-question-hero__type-label">
            {getStage1QuestionTypeLabel(mockQuestion.type)}
          </p>
        ) : null}
        <p className="stage3-question-hero__prompt">{displayPrompt}</p>
        <QuestionImage url={mockQuestion?.imageUrl} className="mt-4" />
        {variant === "audience" && showAudienceNote ? (
          <p className="stage3-question-hero__audience-note">
            شاشة العرض — الإجابات تُعلن لاحقاً
          </p>
        ) : isFacilitator ? (
          <p className="stage3-question-hero__facilitator-note">
            مراقبة إجابات الفرق — تظهر للميسّر قبل الجمهور
          </p>
        ) : null}
      </div>
    </QuestionTransition>
  );
}
