"use client";

import { Stage3GameplayHeader } from "@/features/stage3/components/stage3-gameplay-header";
import { Stage3QuestionOpenScreen } from "@/features/stage3/components/stage3-question-open-screen";
import { useCompetitionContent } from "@/features/competition-content/competition-content-runtime";
import type { Stage3QuestionMetadata } from "@/features/stage3/stage3-question-types";

type Stage3TeamWaitingVariant = "answer_closed" | "reveal" | "results_done";

interface Stage3TeamWaitingScreenProps {
  variant: Stage3TeamWaitingVariant;
  question: Stage3QuestionMetadata | null;
  ownerTeamName: string | null;
}

export function Stage3TeamWaitingScreen({
  variant,
  question,
  ownerTeamName,
}: Stage3TeamWaitingScreenProps) {
  const content = useCompetitionContent();
  const copy = content.stage3TeamWaiting[variant];

  return (
    <div className="gameplay-scene gameplay-scene--centered stage3-scene stage3-scene--waiting">
      <div className="gameplay-flow">
        <section className="gameplay-board-card stage3-unified-card stage3-unified-card--glass stage3-waiting-card">
          <header className="stage3-waiting-top">
            <div className="stage3-waiting-top__meta">
              <Stage3GameplayHeader
                ownerTeamName={ownerTeamName}
                fieldLabel={question?.fieldLabel}
                questionNumber={question?.questionNumber}
                difficulty={question?.difficulty}
                variant="bar"
              />
            </div>
          </header>

          <div className="stage3-waiting-body">
            <Stage3QuestionOpenScreen
              question={question}
              ownerTeamName={ownerTeamName}
              variant="team"
              hideHeader
            />

            <div className={`stage3-wait-panel stage3-wait-panel--${variant}`}>
              <span aria-hidden className="stage3-wait-panel__pulse" />
              <p className="stage3-wait-panel__title">{copy.title}</p>
              <p className="stage3-wait-panel__subtitle">{copy.subtitle}</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
