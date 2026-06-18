"use client";

import { EmptyState } from "@/components/layout/empty-state";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CompetitionRankingBoard } from "@/components/competition/competition-ranking-board";
import { useCompetitionContent } from "@/features/competition-content/competition-content-runtime";
import type { RankedStage2Team } from "@/features/stage2/stage2-ranking";
import { getStageDisplayName, getStageScoreLabel } from "@/features/team/competition-stage-labels";

interface Stage2RankingTableProps {
  teams: RankedStage2Team[];
  loading: boolean;
  error: string | null;
  variant: "facilitator" | "audience";
  title?: string;
  description?: string;
  stageLabel?: string;
  animate?: boolean;
  revealAscending?: boolean;
  layoutReorder?: boolean;
  hideHeader?: boolean;
}

function toRankingEntries(teams: RankedStage2Team[]) {
  return teams.map((team) => ({
    teamId: team.teamId,
    teamName: team.teamName,
    rank: team.rank,
    stageScore: team.stage2Score,
    governorate: team.governorate,
    logoUrl: team.logoUrl,
    totalScore: team.totalScore,
  }));
}

export function Stage2RankingTable({
  teams,
  loading,
  error,
  variant,
  title,
  description,
  stageLabel = "فتشوا الكتب",
  animate = false,
  revealAscending = false,
  layoutReorder = false,
  hideHeader = false,
}: Stage2RankingTableProps) {
  const content = useCompetitionContent();
  const stageName = getStageDisplayName("stage2", content);
  const audience = variant === "audience";
  const resolvedTitle = title ?? `نتائج مرحلة ${stageName}`;
  const resolvedDescription =
    description ??
    (audience
      ? `ترتيب مباشر حسب نقاط ${stageName}.`
      : `يعتمد الترتيب على نقاط ${stageName} ثم المجموع ثم اسم الفريق.`);

  const board = (
    <CompetitionRankingBoard
      animate={(animate || audience) && !revealAscending}
      revealAscending={revealAscending}
      layoutReorder={layoutReorder || ((animate || audience) && !revealAscending)}
      bare={audience}
      emptyTitle="بانتظار تسجيل الفرق"
      error={error}
      loading={loading}
      scoreLabel={getStageScoreLabel("stage2", content)}
      showGovernorate={!audience}
      showTotalScore={!audience}
      teams={toRankingEntries(teams)}
      variant={audience ? "audience" : "facilitator"}
    />
  );

  if (audience) {
    return board;
  }

  return (
    <Card className={hideHeader ? "border-0 bg-transparent shadow-none" : undefined}>
      {!hideHeader ? (
        <CardHeader className={audience ? "text-center" : undefined}>
          {audience ? (
            <p className="text-sm font-bold text-[#4F8A10]">{stageLabel}</p>
          ) : null}
          <CardTitle>{resolvedTitle}</CardTitle>
          <CardDescription>{resolvedDescription}</CardDescription>
        </CardHeader>
      ) : null}
      <CardContent className={hideHeader ? "p-0" : undefined}>
        {!loading && !error && teams.length === 0 ? (
          <EmptyState title="بانتظار تسجيل الفرق" />
        ) : (
          board
        )}
      </CardContent>
    </Card>
  );
}
