"use client";

import { useGameFlow } from "@/features/gameflow/use-game-flow";
import { useCompetitionTimer } from "@/features/gameflow/use-competition-timer";
import { Stage2ReadingPanel } from "@/features/stage2/components/stage2-reading-panel";

export function Stage2ReadingScreen() {
  const { timer } = useCompetitionTimer();
  const { stage2ReadingReference, stage2ReadingPassage } = useGameFlow();
  const hasReadingTimer = Boolean(
    timer?.active && timer.stage === "stage2" && timer.purpose === "reading",
  );

  return (
    <Stage2ReadingPanel
      reference={stage2ReadingReference}
      passage={stage2ReadingPassage}
      hasReadingTimer={hasReadingTimer}
    />
  );
}
