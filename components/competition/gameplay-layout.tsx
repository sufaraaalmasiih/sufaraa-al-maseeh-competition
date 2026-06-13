"use client";

import { cn } from "@/lib/utils";

interface GameplayLayoutProps {
  stageBar?: React.ReactNode;
  handoff?: React.ReactNode;
  progress?: React.ReactNode;
  timer?: React.ReactNode;
  question?: React.ReactNode;
  gameArea: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export function GameplayLayout({
  stageBar,
  handoff,
  progress,
  timer,
  question,
  gameArea,
  actions,
  className,
}: GameplayLayoutProps) {
  return (
    <section className={cn("gameplay-stack", className)}>
      {stageBar}
      {handoff}
      {progress}
      {timer}
      <div className="space-y-2 sm:space-y-3">
        {question}
        {gameArea}
      </div>
      {actions}
    </section>
  );
}
