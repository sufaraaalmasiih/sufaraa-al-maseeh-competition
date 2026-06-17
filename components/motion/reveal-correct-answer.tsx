"use client";

import { motion } from "framer-motion";

interface RevealCorrectAnswerProps {
  label: string;
  value: string;
  className?: string;
  labelClassName?: string;
  valueClassName?: string;
}

export function RevealCorrectAnswer({
  label,
  value,
  className,
  labelClassName,
  valueClassName,
}: RevealCorrectAnswerProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, scale: 0.88, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 320, damping: 24, delay: 0.15 }}
    >
      <motion.p
        className={labelClassName}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.35 }}
      >
        {label}
      </motion.p>
      <motion.p
        className={valueClassName}
        initial={{ opacity: 0, scale: 0.75 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{
          type: "spring",
          stiffness: 400,
          damping: 18,
          delay: 0.45,
        }}
      >
        {value}
      </motion.p>
    </motion.div>
  );
}
