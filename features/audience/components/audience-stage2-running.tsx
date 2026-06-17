"use client";

import { motion } from "framer-motion";
import { Stage2RankingTable } from "@/features/stage2/components/stage2-ranking-table";
import { useStage2Ranking } from "@/features/stage2/use-stage2-ranking";

interface AudienceStage2RunningProps {
  phase: "role_assignment" | "player_turns";
}

const PHASE_COPY = {
  role_assignment: {
    eyebrow: "الترتيب المباشر",
    title: "فتشوا الكتب",
    subtitle: "الفرق توزّع المجالات على المتسابقين",
  },
  player_turns: {
    eyebrow: "الترتيب المباشر",
    title: "فتشوا الكتب",
    subtitle: "أسئلة المرحلة قيد التنفيذ",
  },
} as const;

export function AudienceStage2Running({ phase }: AudienceStage2RunningProps) {
  const { teams, loading, error } = useStage2Ranking();
  const copy = PHASE_COPY[phase];

  return (
    <motion.div
      className="gameplay-scene gameplay-scene--centered audience-live-scene"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.32 }}
    >
      <div className="gameplay-flow">
        <section className="gameplay-board-card audience-live-panel">
          <header className="audience-live-panel__section-head">
            <p className="audience-live-panel__eyebrow">{copy.eyebrow}</p>
            <h2 className="audience-live-panel__title">{copy.title}</h2>
            <p className="audience-live-panel__status">{copy.subtitle}</p>
          </header>
          <Stage2RankingTable
            teams={teams}
            loading={loading}
            error={error}
            variant="audience"
            hideHeader
            animate
          />
        </section>
      </div>
    </motion.div>
  );
}
