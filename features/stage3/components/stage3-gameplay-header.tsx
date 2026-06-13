"use client";

import { STAGE3_NAME } from "@/features/stage3/stage3-constants";
import { STAGE3_DIFFICULTY_LABELS, type Stage3Difficulty } from "@/features/stage3/stage3-question-types";

interface Stage3GameplayHeaderProps {
  ownerTeamName?: string | null;
  fieldLabel?: string;
  questionNumber?: number;
  difficulty?: Stage3Difficulty;
  showOwner?: boolean;
}

export function Stage3GameplayHeader({
  ownerTeamName,
  fieldLabel,
  questionNumber,
  difficulty,
  showOwner = true,
}: Stage3GameplayHeaderProps) {
  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <p className="text-sm font-bold text-[#4F8A10]">{STAGE3_NAME}</p>
      {fieldLabel ? (
        <p className="text-base font-bold text-[#2388C4]">
          {fieldLabel}
          {questionNumber ? ` — س${questionNumber}` : ""}
          {difficulty ? ` · ${STAGE3_DIFFICULTY_LABELS[difficulty]}` : ""}
        </p>
      ) : null}
      {showOwner && ownerTeamName ? (
        <span className="stage3-owner-chip stage3-owner-chip--active">
          الفريق صاحب الدور: {ownerTeamName}
        </span>
      ) : null}
    </div>
  );
}

