"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

const MAX_STAGGER_DELAY = 1.35;
const ROW_DELAY = 0.042;

export function getRankingRowDelay(index: number): number {
  return Math.min(index * ROW_DELAY, MAX_STAGGER_DELAY);
}

interface AnimatedRankingRowProps {
  children: ReactNode;
  index: number;
  animate?: boolean;
  className?: string;
}

export function AnimatedRankingRow({
  children,
  index,
  animate = true,
  className,
}: AnimatedRankingRowProps) {
  return (
    <motion.div
      initial={animate ? { opacity: 0, x: 28, scale: 0.97 } : false}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{
        duration: 0.36,
        delay: animate ? getRankingRowDelay(index) : 0,
        ease: [0.22, 1, 0.36, 1],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface AnimatedRankingTableRowProps {
  children: ReactNode;
  index: number;
  animate?: boolean;
  className?: string;
}

export function AnimatedRankingTableRow({
  children,
  index,
  animate = true,
  className,
}: AnimatedRankingTableRowProps) {
  return (
    <motion.tr
      initial={animate ? { opacity: 0, y: 18, scale: 0.98 } : false}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        type: "spring",
        stiffness: 340,
        damping: 28,
        delay: animate ? getRankingRowDelay(index) : 0,
      }}
      className={className}
    >
      {children}
    </motion.tr>
  );
}
