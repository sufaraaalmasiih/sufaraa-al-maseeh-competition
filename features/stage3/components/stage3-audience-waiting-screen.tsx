"use client";

import { Stage3RankingTable } from "@/features/stage3/components/stage3-ranking-table";
import { Stage3QuestionOpenScreen } from "@/features/stage3/components/stage3-question-open-screen";
import { useCompetitionContent } from "@/features/competition-content/competition-content-runtime";
import type { RankedStage3Team } from "@/features/stage3/stage3-ranking";
import type { Stage3QuestionMetadata } from "@/features/stage3/stage3-question-types";

type Stage3AudienceWaitingVariant = "answer_closed" | "reveal" | "results_done";

interface Stage3AudienceWaitingScreenProps {
  variant: Stage3AudienceWaitingVariant;
  question: Stage3QuestionMetadata | null;
  ownerTeamName: string | null;
  rankingTeams?: RankedStage3Team[];
  rankingLoading?: boolean;
  rankingError?: string | null;
}

export function Stage3AudienceWaitingScreen({
  variant,
  question,
  ownerTeamName,
  rankingTeams = [],
  rankingLoading = false,
  rankingError = null,
}: Stage3AudienceWaitingScreenProps) {
  const content = useCompetitionContent();
  const copy = content.stage3AudienceWaiting[variant];
  const showRanking = variant === "results_done";

  return (
    <div className="stage3-scene stage3-scene--waiting audience-stage3-question-layout audience-stage3-waiting-layout">
      <div className="audience-stage3-question-card audience-stage3-waiting-card">
        <Stage3QuestionOpenScreen
          question={question}
          ownerTeamName={ownerTeamName}
          variant="audience"
          showAudienceNote={false}
        />

        <div className="audience-stage3-waiting-card__status">
          <div className={`stage3-wait-panel stage3-wait-panel--${variant}`}>
            <span aria-hidden className="stage3-wait-panel__pulse" />
            <p className="stage3-wait-panel__title">{copy.title}</p>
            <p className="stage3-wait-panel__subtitle">{copy.subtitle}</p>
          </div>
        </div>

        {showRanking ? (
          <div className="audience-stage3-waiting-card__ranking">
            <Stage3RankingTable
              teams={rankingTeams}
              loading={rankingLoading}
              error={rankingError}
              variant="audience"
              embedded
              animate
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
