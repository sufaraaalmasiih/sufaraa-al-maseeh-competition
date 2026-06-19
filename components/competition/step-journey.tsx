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

  // عدد كبير من الأسئلة: شريط تقدّم مضغوط بدل النقاط (حتى لا تخرج من البطاقة).
  if (total > 14) {
    const percent = Math.round((Math.max(safeCurrent - 1, 0) / Math.max(total - 1, 1)) * 100);
    return (
      <div
        className={cn("step-journey-bar", className)}
        aria-label={`التقدم ${safeCurrent} من ${total}`}
      >
        <div className="step-journey-bar__track">
          <div className="step-journey-bar__fill" style={{ width: `${percent}%` }} />
        </div>
        <span className="step-journey-bar__label">
          {safeCurrent} / {total}
        </span>
      </div>
    );
  }

  return (
    <div
      className={cn("flex flex-wrap items-center justify-center gap-0", className)}
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
