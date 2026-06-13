"use client";

import { cn } from "@/lib/utils";

type MatchingPairTone = "blue" | "green";

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
  pairTone = "blue",
  disabled = false,
  className,
  onClick,
}: MatchingCardProps) {
  return (
    <button
      className={cn(
        "matching-card",
        paired && pairTone === "blue" && "matching-card-pair-blue",
        paired && pairTone === "green" && "matching-card-pair-green",
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
