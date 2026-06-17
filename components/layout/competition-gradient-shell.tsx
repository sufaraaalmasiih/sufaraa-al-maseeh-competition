"use client";

import type { ReactNode } from "react";
import {
  BRAND_BLUE_GRADIENTS,
  GradientBackground,
} from "@/components/ui/gradient-background";
import { cn } from "@/lib/utils";

interface CompetitionGradientShellProps {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  centerContent?: boolean;
  animationDuration?: number;
  gradients?: string[];
  scrollable?: boolean;
  /** Shorter shell for facilitator inline audience mirror (not full viewport). */
  embedded?: boolean;
  animateBackground?: boolean;
}

export function CompetitionGradientShell({
  children,
  className,
  contentClassName,
  centerContent = true,
  animationDuration = 14,
  gradients = BRAND_BLUE_GRADIENTS,
  scrollable = false,
  embedded = false,
  animateBackground = true,
}: CompetitionGradientShellProps) {
  const isScrollable = scrollable || embedded;

  return (
    <GradientBackground
      gradients={gradients}
      animationDuration={animationDuration}
      animateBackground={animateBackground}
      enableCenterContent={centerContent}
      scrollable={isScrollable}
      compact={embedded}
      className={cn(
        embedded && "!h-auto !min-h-[26rem] !max-h-none",
        isScrollable && "!h-auto !min-h-[100dvh] !max-h-none",
        className,
      )}
    >
      <div
        className={cn(
          "mx-auto w-full min-w-0",
          centerContent
            ? (contentClassName ?? "team-waiting-screen__content")
            : contentClassName,
        )}
      >
        {children}
      </div>
    </GradientBackground>
  );
}
