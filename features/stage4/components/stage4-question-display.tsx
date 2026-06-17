"use client";

import { QuestionImage } from "@/components/competition/question-image";
import {
  getStage4QuestionTypeLabel,
  type Stage4QuestionMetadata,
} from "@/features/stage4/stage4-question-types";
import { STAGE4_NAME } from "@/features/stage4/stage4-constants";

interface Stage4QuestionDisplayProps {
  question: Stage4QuestionMetadata | null;
  questionIndex: number;
  questionCount: number;
  variant?: "team" | "facilitator" | "audience";
  embedded?: boolean;
  hideMeta?: boolean;
}

export function Stage4QuestionDisplay({
  question,
  questionIndex,
  questionCount,
  variant = "team",
  embedded = false,
  hideMeta = false,
}: Stage4QuestionDisplayProps) {
  if (!question) {
    return (
      <div className={variant === "facilitator" ? "flow-canvas__inner p-6 text-center" : "glass-card-premium p-6 text-center"}>
        <p className="text-sm font-bold text-muted-foreground">لا يوجد سؤال نشط.</p>
      </div>
    );
  }

  const shellClass =
    variant === "facilitator"
      ? "flow-stage-outro__inner space-y-4 p-6"
      : variant === "audience"
        ? "stage4-question-hero stage4-question-hero--audience glass-card-premium"
        : embedded
          ? "stage4-question-hero"
          : "glass-card-premium space-y-4 p-6";

  return (
    <div className={shellClass}>
      {!hideMeta ? (
        variant === "audience" ? (
          <div className="stage4-question-hero__meta stage4-question-hero__meta--audience">
            <div className="stage4-question-hero__meta-bar">
              <div className="stage4-question-hero__meta-lead">
                <p className="stage4-question-hero__meta-stage">{STAGE4_NAME}</p>
                <p className="stage4-question-hero__meta-progress">
                  السؤال {questionIndex + 1} من {questionCount}
                </p>
              </div>
              <span className="stage4-question-hero__meta-type">
                {getStage4QuestionTypeLabel(question.type)}
              </span>
            </div>
          </div>
        ) : (
          <div className="stage4-question-hero__meta text-center">
            <p className="text-xs font-bold text-[#2388C4]">{STAGE4_NAME}</p>
            <p className="mt-1 text-sm font-semibold text-muted-foreground">
              السؤال {questionIndex + 1} من {questionCount}
            </p>
            <p className="mt-2 text-xs font-bold text-[#B45309]">
              {getStage4QuestionTypeLabel(question.type)}
            </p>
          </div>
        )
      ) : null}

      <h2 className="stage4-question-hero__prompt text-center text-xl font-black text-[#143A5A] sm:text-2xl">
        {question.prompt}
      </h2>

      {question.reference ? (
        <p className="stage4-question-hero__reference">{question.reference}</p>
      ) : null}

      {question.linkText ? (
        <p className="stage4-question-hero__link">{question.linkText}</p>
      ) : null}

      {question.clue ? (
        <p className="stage4-question-hero__clue">{question.clue}</p>
      ) : null}

      <QuestionImage url={question.imageUrl} />
    </div>
  );
}
