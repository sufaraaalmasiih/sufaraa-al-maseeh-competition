"use client";

import { AuroraBackground } from "@/components/competition/aurora-background";
import { GameplayHeaderCard } from "@/components/competition/gameplay-header-card";
import { GameplayQuestionMeta } from "@/components/competition/gameplay-question-meta";
import { cn } from "@/lib/utils";

interface ArenaLayoutProps {
  question: React.ReactNode;
  progress?: React.ReactNode;
  board: React.ReactNode;
  footer?: React.ReactNode;
  questionTypeLabel?: string;
  questionNumber?: number;
  totalQuestions?: number;
  className?: string;
}

export function ArenaLayout({
  question,
  progress,
  board,
  footer,
  questionTypeLabel,
  questionNumber,
  totalQuestions,
  className,
}: ArenaLayoutProps) {
  return (
    <AuroraBackground className={cn("gameplay-scene gameplay-scene--centered", className)}>
      <div className="gameplay-flow aurora-content">
        <GameplayHeaderCard />
        <div className="gameplay-arena-core">
          <section className="gameplay-board-card">
            <GameplayQuestionMeta
              questionNumber={questionNumber}
              totalQuestions={totalQuestions}
              typeLabel={questionTypeLabel}
            />
            <div className="gameplay-question-body">{question}</div>
            {progress ? <div className="gameplay-progress-strip">{progress}</div> : null}
            <div className="gameplay-board-body">{board}</div>
          </section>
          {footer ? <div className="gameplay-action-zone">{footer}</div> : null}
        </div>
      </div>
    </AuroraBackground>
  );
}
