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

type GradientBackgroundProps = React.ComponentProps<"div"> & {
  gradients?: string[];
  animationDuration?: number;
  animationDelay?: number;
  enableCenterContent?: boolean;
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
  overlay = false,
  overlayOpacity = 0.3,
}: GradientBackgroundProps) {
  return (
    <div className={cn("relative h-[100dvh] max-h-[100dvh] min-h-0 w-full overflow-hidden", className)}>
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

      {overlay ? (
        <div
          className="absolute inset-0 bg-black"
          style={{ opacity: overlayOpacity }}
        />
      ) : null}

      {children ? (
        <div
          className={cn(
            "relative z-10 h-full min-h-0 w-full overflow-hidden",
            enableCenterContent && "flex items-center justify-center",
          )}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}
