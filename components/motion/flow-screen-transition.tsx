"use client";

import { AnimatePresence, motion, type Variants } from "framer-motion";

const DEFAULT_VARIANTS: Variants = {
  initial: { opacity: 0, y: 12 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.34, ease: [0.22, 1, 0.36, 1] },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: { duration: 0.2, ease: [0.4, 0, 0.9, 1] },
  },
};

const STAGE_VARIANTS: Variants = {
  initial: { opacity: 0, y: 20, scale: 0.985 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.42, ease: [0.22, 1, 0.36, 1] },
  },
  exit: {
    opacity: 0,
    y: -12,
    scale: 0.99,
    transition: { duration: 0.22, ease: [0.4, 0, 1, 1] },
  },
};

const REVEAL_VARIANTS: Variants = {
  initial: { opacity: 0, scale: 0.98, y: 10 },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.38, ease: [0.22, 1, 0.36, 1] },
  },
  exit: {
    opacity: 0,
    scale: 0.99,
    y: -6,
    transition: { duration: 0.18, ease: [0.4, 0, 1, 1] },
  },
};

/** No visible motion — used during active gameplay to avoid flicker */
const INSTANT_VARIANTS: Variants = {
  initial: { opacity: 1, y: 0, scale: 1 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 1, y: 0, scale: 1, transition: { duration: 0 } },
};

export type FlowScreenTransitionVariant = "default" | "stage" | "reveal" | "instant";

const VARIANT_MAP: Record<FlowScreenTransitionVariant, Variants> = {
  default: DEFAULT_VARIANTS,
  stage: STAGE_VARIANTS,
  reveal: REVEAL_VARIANTS,
  instant: INSTANT_VARIANTS,
};

interface FlowScreenTransitionProps {
  transitionKey: string;
  children: React.ReactNode;
  variant?: FlowScreenTransitionVariant;
  className?: string;
  instant?: boolean;
}

export function FlowScreenTransition({
  transitionKey,
  children,
  variant = "default",
  className,
  instant = false,
}: FlowScreenTransitionProps) {
  const resolvedVariant = instant ? "instant" : variant;

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={transitionKey}
        className={className}
        variants={VARIANT_MAP[resolvedVariant]}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
