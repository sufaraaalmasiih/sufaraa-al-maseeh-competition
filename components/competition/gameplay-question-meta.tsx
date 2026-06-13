"use client";

import { cn } from "@/lib/utils";

interface GameplayQuestionMetaProps {
  typeLabel?: string;
  questionNumber?: number;
  totalQuestions?: number;
  className?: string;
}

export function GameplayQuestionMeta({
  typeLabel,
  questionNumber,
  totalQuestions,
  className,
}: GameplayQuestionMetaProps) {
  const showCounter =
    typeof questionNumber === "number" &&
    typeof totalQuestions === "number" &&
    totalQuestions > 0;

  if (!typeLabel && !showCounter) {
    return null;
  }

  return (
    <div
      className={cn(
        "gameplay-question-meta",
        !typeLabel && showCounter && "gameplay-question-meta--counter-only",
        className,
      )}
    >
      {typeLabel ? <span className="gameplay-question-type">{typeLabel}</span> : null}
      {showCounter ? (
        <span className="gameplay-question-counter">
          السؤال {questionNumber} من {totalQuestions}
        </span>
      ) : null}
    </div>
  );
}
