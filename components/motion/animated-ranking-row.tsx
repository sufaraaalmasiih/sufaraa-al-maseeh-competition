"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

const MAX_STAGGER_DELAY = 0.75;
const ROW_DELAY = 0.05;

export function getRankingRowDelay(index: number): number {
  return Math.min(index * ROW_DELAY, MAX_STAGGER_DELAY);
}

interface AnimatedRankingRowProps {
  children: ReactNode;
  index: number;
  animate?: boolean;
  className?: string;
  variant?: "default" | "audience";
}

export function AnimatedRankingRow({
  children,
  index,
  animate = true,
  className,
  variant = "default",
}: AnimatedRankingRowProps) {
  const isAudience = variant === "audience";

  return (
    <motion.div
      initial={animate ? { opacity: 0, ...(isAudience ? {} : { x: 20, scale: 0.98 }) } : false}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{
        duration: isAudience ? 0.22 : 0.32,
        delay: animate ? getRankingRowDelay(index) : 0,
        ease: "easeOut",
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
  variant?: "default" | "audience";
}

export function AnimatedRankingTableRow({
  children,
  index,
  animate = true,
  className,
  variant = "default",
}: AnimatedRankingTableRowProps) {
  const isAudience = variant === "audience";

  return (
    <motion.tr
      initial={animate ? { opacity: 0, ...(isAudience ? {} : { y: 12 }) } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: isAudience ? 0.2 : 0.28,
        delay: animate ? getRankingRowDelay(index) : 0,
        ease: "easeOut",
      }}
      className={className}
    >
      {children}
    </motion.tr>
  );
}
