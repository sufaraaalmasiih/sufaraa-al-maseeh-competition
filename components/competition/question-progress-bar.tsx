"use client";

import { cn } from "@/lib/utils";

interface QuestionProgressBarProps {
  current: number;
  total: number;
  className?: string;
}

export function QuestionProgressBar({
  current,
  total,
  className,
}: QuestionProgressBarProps) {
  if (total <= 1) {
    return null;
  }

  const safeCurrent = Math.min(Math.max(current, 0), total);
  const percent = Math.round((safeCurrent / total) * 100);

  return (
    <div className={cn("space-y-2", className)} aria-label={`التقدم ${safeCurrent} من ${total}`}>
      <div className="flex items-center justify-center gap-2">
        {Array.from({ length: total }, (_, index) => {
          const step = index + 1;
          const isDone = step < safeCurrent;
          const isActive = step === safeCurrent;

          return (
            <span
              key={`progress-dot-${step}`}
              aria-hidden
              className={cn(
                "competition-dot",
                isDone && "competition-dot-done",
                isActive && "competition-dot-active",
              )}
            />
          );
        })}
      </div>
      <div aria-hidden className="progress-glass-track" role="presentation">
        <div className="progress-glass-fill" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

export const ProgressIndicator = QuestionProgressBar;
