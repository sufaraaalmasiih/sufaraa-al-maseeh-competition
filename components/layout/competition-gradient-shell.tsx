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
}

export function CompetitionGradientShell({
  children,
  className,
  contentClassName,
  centerContent = true,
  animationDuration = 14,
}: CompetitionGradientShellProps) {
  return (
    <GradientBackground
      gradients={BRAND_BLUE_GRADIENTS}
      animationDuration={animationDuration}
      enableCenterContent={centerContent}
      className={className}
    >
      <div
        className={cn(
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
