"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface RevealResultChipProps {
  label: string;
  value: string;
  index?: number;
  highlight?: boolean;
  className?: string;
  labelClassName?: string;
  valueClassName?: string;
  highlightClassName?: string;
}

export function RevealResultChip({
  label,
  value,
  index = 0,
  highlight = false,
  className,
  labelClassName,
  valueClassName,
  highlightClassName,
}: RevealResultChipProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 28, scale: 0.9, rotateX: -8 }}
      animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
      transition={{
        type: "spring",
        stiffness: 340,
        damping: 24,
        delay: 0.55 + index * 0.38,
      }}
    >
      <p className={labelClassName}>{label}</p>
      <p
        className={cn(
          valueClassName,
          highlight ? highlightClassName : undefined,
        )}
      >
        {value}
      </p>
    </motion.div>
  );
}
