"use client";

import type { ReactNode } from "react";
import { Stage3GameplayHeader } from "@/features/stage3/components/stage3-gameplay-header";
import { STAGE3_NAME } from "@/features/stage3/stage3-constants";
import { getStage3MockQuestion } from "@/features/stage3/stage3-mock-questions";
import { STAGE3_SELECTION_TIMEOUT_PENALTY } from "@/features/stage3/stage3-official-constants";
import { isStage3SelectionTimeoutQuestion } from "@/features/stage3/stage3-selection-timeout-question";
import { STAGE3_DIFFICULTY_LABELS, type Stage3QuestionMetadata } from "@/features/stage3/stage3-question-types";

interface Stage3RevealSummaryProps {
  question: Stage3QuestionMetadata | null;
  ownerTeamName?: string | null;
  /** Render inside a parent gameplay-board-card */
  embedded?: boolean;
}

function RevealShell({
  embedded,
  className,
  children,
}: {
  embedded?: boolean;
  className?: string;
  children: ReactNode;
}) {
  if (embedded) {
    return <div className={className}>{children}</div>;
  }

  return <section className={className}>{children}</section>;
}

export function Stage3RevealSummary({
  question,
  ownerTeamName,
  embedded = false,
}: Stage3RevealSummaryProps) {
  if (!question) {
    return (
      <div className="stage3-question-hero">
        <p className="stage3-question-hero__title">الإعلان</p>
        <p className="stage3-question-hero__prompt text-xl">لا يوجد تحدٍ للإعلان</p>
      </div>
    );
  }

  if (isStage3SelectionTimeoutQuestion(question)) {
    return (
      <RevealShell
        embedded={embedded}
        className={
          embedded
            ? "stage3-reveal-card__body"
            : "gameplay-board-card stage3-reveal-card stage3-unified-card"
        }
      >
        <div className="stage3-reveal-card__meta">
          <p className="stage3-reveal-card__kicker">{STAGE3_NAME}</p>
          <p className="stage3-reveal-card__context">
            {question.fieldLabel} · {STAGE3_DIFFICULTY_LABELS[question.difficulty]}
          </p>
          {ownerTeamName ? (
            <span className="stage3-owner-chip stage3-owner-chip--active">
              الفريق صاحب الدور: {ownerTeamName}
            </span>
          ) : null}
        </div>

        <div className="stage3-reveal-card__divider" aria-hidden />

        <div className="stage3-reveal-card__announce">
          <p className="stage3-reveal-card__label">الإعلان</p>
          <p className="stage3-reveal-card__subtitle">انتهى وقت اختيار السؤال</p>
          <p className="stage3-reveal-card__headline">لم يُختر سؤال في الوقت المحدد</p>
          <p className="stage3-reveal-card__penalty">
            خصم {Math.abs(STAGE3_SELECTION_TIMEOUT_PENALTY)} نقاط على صاحب الدور
          </p>
        </div>
      </RevealShell>
    );
  }

  const mockQuestion = getStage3MockQuestion(question.id);

  return (
    <RevealShell
      embedded={embedded}
      className={embedded ? undefined : "gameplay-board-card stage3-unified-card"}
    >
      <Stage3GameplayHeader ownerTeamName={ownerTeamName} showLead={false} />

      <div className="stage3-question-hero stage3-question-hero--prompt-only">
        <p className="stage3-question-hero__title">الإعلان</p>
        <p className="stage3-question-hero__field">
          {question.fieldLabel} · س{question.questionNumber}
        </p>
        <p className="stage3-question-hero__answer-label">الإجابة الصحيحة</p>
        <p className="stage3-question-hero__answer">
          {mockQuestion?.correctAnswer ?? "—"}
        </p>
      </div>
    </RevealShell>
  );
}
