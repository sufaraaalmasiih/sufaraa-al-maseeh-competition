"use client";

import { memo, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface AuroraBackgroundProps {
  children: ReactNode;
  className?: string;
}

/** Content wrapper only — full-viewport aurora lives on `.aurora-page` in globals.css */
function AuroraBackgroundInner({ children, className }: AuroraBackgroundProps) {
  return <div className={cn("aurora-scene", className)}>{children}</div>;
}

export const AuroraBackground = memo(AuroraBackgroundInner);
