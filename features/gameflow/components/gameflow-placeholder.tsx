"use client";

import { motion } from "framer-motion";

interface GameFlowPlaceholderProps {
  title: string;
  description?: string;
}

export function GameFlowPlaceholder({
  title,
  description = "هذه شاشة تأسيسية فقط ضمن Sprint 1.",
}: GameFlowPlaceholderProps) {
  return (
    <motion.section
      className="competition-stage-screen"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <div className="competition-stage-screen__card glass-card-white">
        <div
          aria-hidden
          className="mx-auto mb-4 h-1 w-20 rounded-full"
          style={{ background: "linear-gradient(90deg, #84CB2E, #4F8A10)" }}
        />
        <h2 className="competition-stage-screen__title">{title}</h2>
        <p className="competition-stage-screen__subtitle">{description}</p>
      </div>
    </motion.section>
  );
}
