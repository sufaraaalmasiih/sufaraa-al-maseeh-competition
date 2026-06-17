"use client";

import { AnimatedRankingRow } from "@/components/motion/animated-ranking-row";
import { useGradualReveal } from "@/hooks/use-gradual-reveal";
import type { FinalResultTeam } from "@/features/facilitator/use-final-results";
import { cn } from "@/lib/utils";

interface FinalResultsRankingPanelProps {
  teams: FinalResultTeam[];
  animate?: boolean;
  title?: string;
  description?: string;
}

export function FinalResultsRankingPanel({
  teams,
  animate = true,
  title = "الترتيب العام",
  description = "حسب المجموع الكلي",
}: FinalResultsRankingPanelProps) {
  const revealedTeams = useGradualReveal(teams, animate ? 520 : 0, {
    maxDurationMs: 7_500,
  });
  const visibleTeams = animate ? revealedTeams : teams;
  const isRevealing = animate && visibleTeams.length < teams.length;

  return (
    <div className="competition-ranking-panel competition-ranking-panel--final">
      <div className="competition-ranking-panel__header">
        <h3 className="competition-ranking-panel__title">{title}</h3>
        <p className="competition-ranking-panel__desc">
          {isRevealing
            ? `جاري الإعلان... (${visibleTeams.length}/${teams.length})`
            : description}
        </p>
      </div>
        <div className="competition-ranking-scroll competition-ranking-scroll--cards competition-ranking-scroll--final">
          {visibleTeams.map((team, index) => (
            <AnimatedRankingRow
              key={team.teamId}
              index={index}
              animate={animate && isRevealing}
            className={cn(
              "competition-ranking-row competition-ranking-row--card",
              team.rank === 1 && "competition-ranking-row--gold",
              team.rank === 2 && "competition-ranking-row--silver",
              team.rank === 3 && "competition-ranking-row--bronze",
            )}
          >
            <span className="competition-ranking-row__rank">{team.rank}</span>
            <div className="competition-ranking-row__team">
              <p className="competition-ranking-row__name">{team.teamName}</p>
              <p className="competition-ranking-row__meta">{team.governorate}</p>
            </div>
            <div className="competition-ranking-row__score">
              <span className="competition-ranking-row__score-label">المجموع</span>
              <span className="competition-ranking-row__score-value">{team.total}</span>
            </div>
          </AnimatedRankingRow>
        ))}
      </div>
    </div>
  );
}
