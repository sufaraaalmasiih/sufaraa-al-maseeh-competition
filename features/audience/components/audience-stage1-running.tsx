"use client";

import { motion } from "framer-motion";
import { Stage1RankingTable } from "@/features/stage1/components/stage1-ranking-table";
import { useStage1Ranking } from "@/features/stage1/use-stage1-ranking";

export function AudienceStage1Running() {
  const { teams, loading, error } = useStage1Ranking();

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
            <p className="audience-live-panel__eyebrow">الترتيب المباشر</p>
            <h2 className="audience-live-panel__title">اجمعوا الكنوز</h2>
          </header>
          <Stage1RankingTable
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
