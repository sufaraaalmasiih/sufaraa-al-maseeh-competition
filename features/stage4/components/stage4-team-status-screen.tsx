"use client";

import { STAGE4_NAME } from "@/features/stage4/stage4-constants";
import { cn } from "@/lib/utils";

type Stage4TeamStatusTone = "waiting" | "closed";

interface Stage4TeamStatusScreenProps {
  panelTitle: string;
  panelSubtitle: string;
  questionIndex: number;
  questionCount: number;
  tone?: Stage4TeamStatusTone;
}

export function Stage4TeamStatusScreen({
  panelTitle,
  panelSubtitle,
  questionIndex,
  questionCount,
  tone = "waiting",
}: Stage4TeamStatusScreenProps) {
  const questionLabel = `السؤال ${Math.min(questionIndex + 1, questionCount)} من ${questionCount}`;

  return (
    <div className="gameplay-scene gameplay-scene--centered stage4-scene stage4-scene--status">
      <div className="gameplay-flow">
        <section className="gameplay-board-card stage4-unified-card stage4-unified-card--glass stage4-team-card stage4-status-card">
          <header className="stage4-status-top">
            <div className="stage4-question-top__meta">
              <div className="stage4-question-top__bar">
                <div className="stage4-question-top__lead">
                  <p className="stage4-question-top__label">{STAGE4_NAME}</p>
                  <p className="stage4-question-top__progress">{questionLabel}</p>
                </div>
              </div>
            </div>
          </header>

          <div className="stage4-status-body">
            <div
              className={cn(
                "stage4-wait-panel",
                tone === "closed" && "stage4-wait-panel--closed",
              )}
            >
              <span aria-hidden className="stage4-wait-panel__pulse" />
              <p className="stage4-wait-panel__title">{panelTitle}</p>
              <p className="stage4-wait-panel__subtitle">{panelSubtitle}</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
