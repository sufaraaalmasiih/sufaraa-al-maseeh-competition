"use client";

import { cn } from "@/lib/utils";

interface StepJourneyProps {
  current: number;
  total: number;
  className?: string;
}

export function StepJourney({ current, total, className }: StepJourneyProps) {
  if (total <= 1) {
    return null;
  }

  const safeCurrent = Math.min(Math.max(current, 0), total);

  return (
    <div
      className={cn("flex items-center justify-center gap-0", className)}
      aria-label={`التقدم ${safeCurrent} من ${total}`}
    >
      {Array.from({ length: total }, (_, index) => {
        const step = index + 1;
        const isDone = step < safeCurrent;
        const isActive = step === safeCurrent;
        const isLast = index === total - 1;

        return (
          <span key={`journey-step-${step}`} className="flex items-center">
            <span
              aria-hidden
              className={cn(
                "step-journey-dot",
                isDone && "step-journey-dot-done",
                isActive && "step-journey-dot-active",
              )}
            />
            {!isLast ? (
              <span
                aria-hidden
                className={cn("step-journey-line", isDone && "step-journey-line-done")}
              />
            ) : null}
          </span>
        );
      })}
    </div>
  );
}
