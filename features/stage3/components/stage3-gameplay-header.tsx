"use client";

import { STAGE3_NAME } from "@/features/stage3/stage3-constants";
import { STAGE3_DIFFICULTY_LABELS, type Stage3Difficulty } from "@/features/stage3/stage3-question-types";
import { cn } from "@/lib/utils";

interface Stage3GameplayHeaderProps {
  ownerTeamName?: string | null;
  fieldLabel?: string;
  questionNumber?: number;
  difficulty?: Stage3Difficulty;
  showOwner?: boolean;
  showLead?: boolean;
  variant?: "default" | "bar";
}

export function Stage3GameplayHeader({
  ownerTeamName,
  fieldLabel,
  questionNumber,
  difficulty,
  showOwner = true,
  showLead = true,
  variant = "default",
}: Stage3GameplayHeaderProps) {
  const contextParts: string[] = [];
  if (fieldLabel) {
    contextParts.push(fieldLabel);
  }
  if (questionNumber) {
    contextParts.push(`سؤال ${questionNumber}`);
  }
  if (difficulty) {
    contextParts.push(STAGE3_DIFFICULTY_LABELS[difficulty]);
  }

  const showOwnerBlock = showOwner && ownerTeamName;
  const hasContent = showLead || showOwnerBlock;

  if (!hasContent) {
    return null;
  }

  return (
    <header className={cn("stage3-gameplay-header", variant === "bar" && "stage3-gameplay-header--bar")}>
      {showLead ? (
        <div className="stage3-gameplay-header__lead">
          <span className="stage3-gameplay-header__badge">{STAGE3_NAME}</span>
          {contextParts.length > 0 ? (
            <p className="stage3-gameplay-header__context">{contextParts.join(" · ")}</p>
          ) : null}
        </div>
      ) : null}

      {showOwnerBlock ? (
        <div className="stage3-gameplay-header__owner">
          <span className="stage3-gameplay-header__owner-label">صاحب الدور</span>
          <span className="stage3-gameplay-header__owner-name">{ownerTeamName}</span>
        </div>
      ) : null}
    </header>
  );
}
