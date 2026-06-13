"use client";

import { cn } from "@/lib/utils";

export interface StageHeaderSegment {
  text: string;
  accent?: boolean;
}

interface StageHeaderBarProps {
  segments: StageHeaderSegment[];
  className?: string;
}

export function StageHeaderBar({ segments, className }: StageHeaderBarProps) {
  const visibleSegments = segments.filter((segment) => segment.text.trim().length > 0);

  if (visibleSegments.length === 0) {
    return null;
  }

  return (
    <header className={cn("glass-stage-bar", className)}>
      {visibleSegments.map((segment, index) => (
        <span key={`${segment.text}-${index}`} className="inline-flex items-center gap-2">
          {index > 0 ? (
            <span aria-hidden className="text-[#143A5A]/25">
              ·
            </span>
          ) : null}
          <span
            className={cn(
              segment.accent && "font-black text-[#4F8A10]",
              !segment.accent && "font-semibold text-[#143A5A]/80",
            )}
          >
            {segment.text}
          </span>
        </span>
      ))}
    </header>
  );
}
