"use client";

import { motion } from "framer-motion";
import { useGameFlow } from "@/features/gameflow/use-game-flow";
import { useCompetitionTimer } from "@/features/gameflow/use-competition-timer";
import { Stage2ReadingPanel } from "@/features/stage2/components/stage2-reading-panel";

export function AudienceStage2Reading() {
  const { timer } = useCompetitionTimer();
  const { stage2ReadingReference, stage2ReadingPassage } = useGameFlow();
  const hasReadingTimer = Boolean(
    timer?.active && timer.stage === "stage2" && timer.purpose === "reading",
  );

  return (
    <motion.div
      className="audience-stage2-reading"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
    >
      <Stage2ReadingPanel
        reference={stage2ReadingReference}
        passage={stage2ReadingPassage}
        hasReadingTimer={hasReadingTimer}
      />
    </motion.div>
  );
}
