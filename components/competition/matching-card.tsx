"use client";

import { cn } from "@/lib/utils";

export type MatchingPairTone = 0 | 1 | 2 | 3 | 4;

const PAIR_TONE_CLASSES: Record<MatchingPairTone, string> = {
  0: "matching-card-pair-0",
  1: "matching-card-pair-1",
  2: "matching-card-pair-2",
  3: "matching-card-pair-3",
  4: "matching-card-pair-4",
};

interface MatchingCardProps {
  children: React.ReactNode;
  selected?: boolean;
  paired?: boolean;
  pairTone?: MatchingPairTone;
  disabled?: boolean;
  className?: string;
  onClick?: () => void;
}

export function MatchingCard({
  children,
  selected = false,
  paired = false,
  pairTone = 0,
  disabled = false,
  className,
  onClick,
}: MatchingCardProps) {
  return (
    <button
      className={cn(
        "matching-card",
        paired && PAIR_TONE_CLASSES[pairTone],
        selected && !paired && "matching-card-selected",
        disabled && "cursor-not-allowed opacity-75",
        className,
      )}
      disabled={disabled}
      type="button"
      onClick={onClick}
    >
      {children}
    </button>
  );
}
