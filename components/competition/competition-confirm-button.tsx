"use client";

import { memo } from "react";
import { GameReadyButton } from "@/components/ui/game-ready-button";
import { cn } from "@/lib/utils";

interface CompetitionConfirmButtonProps {
  children: React.ReactNode;
  disabled?: boolean;
  confirmed?: boolean;
  confirmedLabel?: string;
  confirmMessage?: string;
  buttonClassName?: string;
  onClick: () => void;
  className?: string;
}

function CompetitionConfirmButtonInner({
  children,
  disabled,
  confirmed = false,
  confirmedLabel = "تم تأكيد الإجابة",
  confirmMessage,
  buttonClassName,
  onClick,
  className,
}: CompetitionConfirmButtonProps) {
  function handleClick() {
    if (disabled || confirmed) {
      return;
    }
    if (confirmMessage && !window.confirm(confirmMessage)) {
      return;
    }
    onClick();
  }

  return (
    <div className={cn("game-ready-btn-wrap", className)}>
      <GameReadyButton
        className={buttonClassName}
        disabled={disabled}
        forcePressed={confirmed}
        data-sound="answer_submit"
        type="button"
        onClick={handleClick}
      >
        {confirmed ? confirmedLabel : children}
      </GameReadyButton>
    </div>
  );
}

export const CompetitionConfirmButton = memo(CompetitionConfirmButtonInner);
export const ConfirmButton = CompetitionConfirmButton;
