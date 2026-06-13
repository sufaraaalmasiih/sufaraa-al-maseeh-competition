"use client";

import type { Stage4QuestionMetadata } from "@/features/stage4/stage4-question-types";
import { STAGE4_NAME } from "@/features/stage4/stage4-constants";

interface Stage4QuestionDisplayProps {
  question: Stage4QuestionMetadata | null;
  questionIndex: number;
  questionCount: number;
  variant?: "team" | "facilitator" | "audience";
}

const TYPE_LABELS = {
  link: "الرابط العجيب",
  image: "صور",
  who_am_i: "من أنا",
} as const;

export function Stage4QuestionDisplay({
  question,
  questionIndex,
  questionCount,
  variant = "team",
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
      : "glass-card-premium space-y-4 p-6";

  return (
    <div className={shellClass}>
      <div className="text-center">
        <p className="text-xs font-bold text-[#2388C4]">{STAGE4_NAME}</p>
        <p className="mt-1 text-sm font-semibold text-muted-foreground">
          السؤال {questionIndex + 1} من {questionCount}
        </p>
        <p className="mt-2 text-xs font-bold text-[#B45309]">{TYPE_LABELS[question.type]}</p>
      </div>

      <h2 className="text-center text-xl font-black text-[#143A5A]">{question.prompt}</h2>

      {question.linkText ? (
        <p className="rounded-md border border-primary/15 bg-[#F3FAFF] px-4 py-3 text-center text-lg font-bold text-[#143A5A]">
          {question.linkText}
        </p>
      ) : null}

      {question.clue ? (
        <p className="rounded-md border border-primary/15 bg-[#FFF8E8] px-4 py-3 text-center text-base leading-8 text-[#143A5A]">
          {question.clue}
        </p>
      ) : null}

      {question.imageUrl && question.type === "image" ? (
        <div className="flex justify-center">
          <div className="flex h-32 w-32 items-center justify-center rounded-xl border border-primary/15 bg-white text-sm font-bold text-muted-foreground">
            {variant === "audience" ? "صورة السؤال" : "صورة"}
          </div>
        </div>
      ) : null}
    </div>
  );
}
