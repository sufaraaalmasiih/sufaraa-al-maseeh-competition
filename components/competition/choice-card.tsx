"use client";

import { cn } from "@/lib/utils";

type ChoiceVariant = "default" | "true" | "false";

interface ChoiceCardProps {
  children: React.ReactNode;
  selected?: boolean;
  variant?: ChoiceVariant;
  disabled?: boolean;
  className?: string;
  onClick?: () => void;
}

export function ChoiceCard({
  children,
  selected = false,
  variant = "default",
  disabled = false,
  className,
  onClick,
}: ChoiceCardProps) {
  return (
    <button
      className={cn(
        "choice-card",
        selected && variant === "true" && "choice-card-true choice-card-selected",
        selected && variant === "false" && "choice-card-false choice-card-selected",
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
