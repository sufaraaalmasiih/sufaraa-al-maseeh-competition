"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface AudienceLivePanelProps {
  className?: string;
  children: ReactNode;
  delay?: number;
}

export function AudienceLivePanel({ className, children, delay = 0 }: AudienceLivePanelProps) {
  return (
    <motion.div
      className={cn("audience-live-panel glass-card-white", className)}
      initial={{ opacity: 0, y: 16, scale: 0.985 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.38, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
