"use client";

import { StageHeaderBar } from "@/components/competition/stage-header-bar";

interface Stage2FieldPlayerHeaderProps {
  fieldOrder: number;
  fieldLabel: string;
  assignedPlayerName: string;
}

export function Stage2FieldPlayerHeader({
  fieldOrder,
  fieldLabel,
  assignedPlayerName,
}: Stage2FieldPlayerHeaderProps) {
  return (
    <StageHeaderBar
      segments={[
        { text: "فتشوا الكتب", accent: true },
        { text: `م${fieldOrder}: ${fieldLabel}` },
        { text: `اللاعب: ${assignedPlayerName}` },
      ]}
    />
  );
}
