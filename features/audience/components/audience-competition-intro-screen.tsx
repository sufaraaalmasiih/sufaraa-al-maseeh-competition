"use client";

import { motion } from "framer-motion";
import { CompetitionIntroContent } from "@/features/gameflow/components/competition-intro-content";

export function AudienceCompetitionIntroScreen() {
  return (
    <motion.div
      className="competition-intro-screen audience-competition-intro"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      <CompetitionIntroContent />
    </motion.div>
  );
}
