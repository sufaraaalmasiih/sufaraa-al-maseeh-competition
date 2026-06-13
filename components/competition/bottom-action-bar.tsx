"use client";

import { cn } from "@/lib/utils";

interface BottomActionBarProps {
  children: React.ReactNode;
  className?: string;
}

export function BottomActionBar({ children, className }: BottomActionBarProps) {
  return <div className={cn("bottom-action-bar", className)}>{children}</div>;
}
