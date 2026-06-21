"use client";

import { CompetitionRankingBoard } from "@/components/competition/competition-ranking-board";
import type { FinalResultTeam } from "@/features/facilitator/use-final-results";

interface FinalResultsRankingPanelProps {
  teams: FinalResultTeam[];
  animate?: boolean;
  revealAscending?: boolean;
  variant?: "audience" | "embedded" | "facilitator";
  title?: string;
  description?: string;
}

export function FinalResultsRankingPanel({
  teams,
  animate = true,
  revealAscending = false,
  variant = "embedded",
  title = "الترتيب العام",
  description = "حسب المجموع الكلي",
}: FinalResultsRankingPanelProps) {
  return (
    <div className="competition-ranking-panel competition-ranking-panel--final">
      <div className="competition-ranking-panel__header">
        <h3 className="competition-ranking-panel__title">{title}</h3>
        <p className="competition-ranking-panel__desc">{description}</p>
      </div>
      <CompetitionRankingBoard
        animate={animate && !revealAscending}
        revealAscending={revealAscending}
        bare
        autoFit={variant === "audience"}
        scoreLabel="المجموع"
        teams={teams.map((team) => ({
          teamId: team.teamId,
          teamName: team.teamName,
          rank: team.rank,
          stageScore: team.total,
          governorate: team.governorate,
          meta: `المرحلة الأولى: ${team.stage1} · المرحلة الثانية: ${team.stage2} · المرحلة الثالثة: ${team.stage3} · المرحلة الرابعة: ${team.stage4}`,
        }))}
        variant={variant}
      />
    </div>
  );
}
