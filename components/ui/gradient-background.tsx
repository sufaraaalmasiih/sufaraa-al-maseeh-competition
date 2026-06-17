"use client";

import type React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export const BRAND_BLUE_GRADIENTS = [
  "linear-gradient(155deg, #4a9fd4 0%, #1f6a9a 48%, #0f3550 100%)",
  "linear-gradient(175deg, #2d7aad 0%, #164f72 55%, #123d58 100%)",
  "linear-gradient(145deg, #0f3550 0%, #1f6a9a 50%, #3d96c4 100%)",
  "linear-gradient(165deg, #3d96c4 0%, #1a5f8f 45%, #123d58 100%)",
  "linear-gradient(185deg, #1f6a9a 0%, #4a9fd4 40%, #164f72 100%)",
  "linear-gradient(155deg, #4a9fd4 0%, #1f6a9a 48%, #0f3550 100%)",
];

/** خلفية فاتحة لشاشة الجمهور في وضع ملء الشاشة */
export const BRAND_ARENA_LIGHT_GRADIENTS = [
  "linear-gradient(165deg, #ffffff 0%, #f6f9fc 38%, #f2f7f4 72%, #faf8f5 100%)",
  "linear-gradient(170deg, #f8fbff 0%, #f3f8f4 42%, #ffffff 100%)",
  "linear-gradient(160deg, #ffffff 0%, #eef6fc 35%, #f4faf4 100%)",
  "linear-gradient(175deg, #f6f9fc 0%, #ffffff 50%, #f2f7f4 100%)",
  "linear-gradient(165deg, #ffffff 0%, #f6f9fc 38%, #f2f7f4 72%, #faf8f5 100%)",
];

type GradientBackgroundProps = React.ComponentProps<"div"> & {
  gradients?: string[];
  /** When false, keeps a static gradient (lighter on auth screens). */
  animateBackground?: boolean;
  animationDuration?: number;
  animationDelay?: number;
  enableCenterContent?: boolean;
  scrollable?: boolean;
  /** Use content height instead of full viewport (inline facilitator mirror). */
  compact?: boolean;
  overlay?: boolean;
  overlayOpacity?: number;
};

export function GradientBackground({
  children,
  className = "",
  gradients = BRAND_BLUE_GRADIENTS,
  animationDuration = 20,
  animationDelay = 0,
  enableCenterContent = true,
  scrollable = false,
  compact = false,
  overlay = false,
  overlayOpacity = 0.3,
  animateBackground = true,
}: GradientBackgroundProps) {
  const backgroundNode = animateBackground ? (
    <motion.div
      className="absolute inset-0"
      style={{ background: gradients[0] }}
      animate={{ background: gradients }}
      transition={{
        delay: animationDelay,
        duration: animationDuration,
        repeat: Number.POSITIVE_INFINITY,
        ease: "easeInOut",
      }}
    />
  ) : (
    <div className="absolute inset-0" style={{ background: gradients[0] }} />
  );

  return (
    <div
      className={cn(
        "relative w-full",
        scrollable ? "min-h-[100dvh] overflow-x-hidden overflow-y-auto" : "h-[100dvh] max-h-[100dvh] min-h-0 overflow-hidden",
        className,
      )}
    >
      {backgroundNode}

      {overlay ? (
        <div
          className="absolute inset-0 bg-black"
          style={{ opacity: overlayOpacity }}
        />
      ) : null}

      {children ? (
        <div
          className={cn(
            "relative z-10 w-full",
            scrollable
              ? cn(
                  compact ? "min-h-0" : "min-h-[100dvh]",
                  "flex w-full flex-col items-center",
                  enableCenterContent && "justify-center",
                )
              : cn(
                  "flex h-full min-h-0 flex-col overflow-hidden",
                  enableCenterContent && "items-center justify-center",
                ),
          )}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}
