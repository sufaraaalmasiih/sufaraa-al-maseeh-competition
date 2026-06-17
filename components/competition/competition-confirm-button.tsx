"use client";

import { memo } from "react";
import { GameReadyButton } from "@/components/ui/game-ready-button";
import { cn } from "@/lib/utils";

interface CompetitionConfirmButtonProps {
  children: React.ReactNode;
  disabled?: boolean;
  confirmed?: boolean;
  confirmedLabel?: string;
  buttonClassName?: string;
  onClick: () => void;
  className?: string;
}

function CompetitionConfirmButtonInner({
  children,
  disabled,
  confirmed = false,
  confirmedLabel = "تم تأكيد الإجابة",
  buttonClassName,
  onClick,
  className,
}: CompetitionConfirmButtonProps) {
  return (
    <div className={cn("game-ready-btn-wrap", className)}>
      <GameReadyButton
        className={buttonClassName}
        disabled={disabled}
        forcePressed={confirmed}
        type="button"
        onClick={onClick}
      >
        {confirmed ? confirmedLabel : children}
      </GameReadyButton>
    </div>
  );
}

export const CompetitionConfirmButton = memo(CompetitionConfirmButtonInner);
export const ConfirmButton = CompetitionConfirmButton;
