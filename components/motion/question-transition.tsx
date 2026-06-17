"use client";

import { AnimatePresence, motion } from "framer-motion";

interface QuestionTransitionProps {
  questionKey: string;
  children: React.ReactNode;
  className?: string;
}

export function QuestionTransition({
  questionKey,
  children,
  className,
}: QuestionTransitionProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={questionKey}
        className={className}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}