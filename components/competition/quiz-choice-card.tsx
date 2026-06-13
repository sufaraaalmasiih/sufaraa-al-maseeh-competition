"use client";

import { cn } from "@/lib/utils";

interface QuizChoiceCardProps {
  children: React.ReactNode;
  selected?: boolean;
  disabled?: boolean;
  className?: string;
  onClick?: () => void;
}

export function QuizChoiceCard({
  children,
  selected = false,
  disabled = false,
  className,
  onClick,
}: QuizChoiceCardProps) {
  return (
    <button
      className={cn("quiz-choice-card", selected && "quiz-choice-card-selected", className)}
      disabled={disabled}
      type="button"
      onClick={onClick}
    >
      {children}
    </button>
  );
}
