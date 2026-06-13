"use client";

import { memo } from "react";
import { GameReadyButton } from "@/components/ui/game-ready-button";
import { cn } from "@/lib/utils";

interface CompetitionConfirmButtonProps {
  children: React.ReactNode;
  disabled?: boolean;
  onClick: () => void;
  className?: string;
}

function CompetitionConfirmButtonInner({
  children,
  disabled,
  onClick,
  className,
}: CompetitionConfirmButtonProps) {
  return (
    <div className={cn("game-ready-btn-wrap", className)}>
      <GameReadyButton disabled={disabled} type="button" onClick={onClick}>
        {children}
      </GameReadyButton>
    </div>
  );
}

export const CompetitionConfirmButton = memo(CompetitionConfirmButtonInner);
export const ConfirmButton = CompetitionConfirmButton;
