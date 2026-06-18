"use client";

import { EmptyState } from "@/components/layout/empty-state";
import { ErrorState, LoadingState } from "@/components/layout/state-view";
import {
  CompetitionRankingTable,
  type CompetitionRankingTableEntry,
} from "@/components/competition/competition-ranking-table";
import { cn } from "@/lib/utils";

export interface CompetitionRankingEntry {
  teamId: string;
  teamName: string;
  rank: number;
  stageScore: number;
  governorate?: string;
  logoUrl?: string | null;
  totalScore?: number;
  meta?: string;
  extraValue?: string | number | null;
}

interface CompetitionRankingBoardProps {
  teams: CompetitionRankingEntry[];
  loading?: boolean;
  error?: string | null;
  scoreLabel?: string;
  animate?: boolean;
  variant?: "audience" | "team" | "embedded" | "facilitator";
  emptyTitle?: string;
  className?: string;
  title?: string;
  subtitle?: string;
  extraColumnLabel?: string;
  showGovernorate?: boolean;
  showExtraColumn?: boolean;
  /** Skip outer panel wrapper when parent already provides layout chrome. */
  bare?: boolean;
}

function toTableEntries(teams: CompetitionRankingEntry[]): CompetitionRankingTableEntry[] {
  return teams.map((team) => ({
    teamId: team.teamId,
    teamName: team.teamName,
    rank: team.rank,
    stageScore: team.stageScore,
    governorate: team.governorate,
    logoUrl: team.logoUrl,
    totalScore: team.totalScore,
    meta: team.meta,
    extraValue: team.extraValue,
  }));
}

export function CompetitionRankingBoard({
  teams,
  loading = false,
  error = null,
  scoreLabel = "نقاط المرحلة",
  animate = false,
  variant = "audience",
  emptyTitle = "بانتظار تسجيل الفرق",
  className,
  title,
  subtitle,
  extraColumnLabel,
  showGovernorate = true,
  showExtraColumn = false,
  bare = false,
}: CompetitionRankingBoardProps) {
  if (loading) {
    return <LoadingState variant="inline" />;
  }

  if (error) {
    return <ErrorState title="تعذر تحميل الترتيب" description={error} />;
  }

  if (teams.length === 0) {
    return <EmptyState title={emptyTitle} />;
  }

  const compact = variant === "audience" || variant === "team" || variant === "embedded";
  const densityClass =
    teams.length > 12
      ? "competition-ranking-scroll--dense"
      : teams.length > 6
        ? "competition-ranking-scroll--medium"
        : "competition-ranking-scroll--comfortable";

  const table = (
    <CompetitionRankingTable
      animate={animate || variant === "team"}
      className={cn(bare && className)}
      compact={compact}
      extraColumnLabel={extraColumnLabel}
      scoreLabel={scoreLabel}
      showExtraColumn={showExtraColumn}
      showGovernorate={showGovernorate}
      subtitle={subtitle}
      teams={toTableEntries(teams)}
      title={title}
    />
  );

  if (bare) {
    return (
      <div
        className={cn(
          "competition-ranking-scroll competition-ranking-scroll--cards competition-ranking-scroll--live",
          densityClass,
        )}
        role="list"
        aria-label="ترتيب الفرق"
      >
        {table}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "competition-ranking-panel competition-ranking-panel--live competition-ranking-panel--table",
        variant === "embedded" && "competition-ranking-panel--embedded",
        variant === "audience" && "competition-ranking-panel--audience",
        className,
      )}
    >
      <div
        className={cn(
          "competition-ranking-scroll competition-ranking-scroll--cards competition-ranking-scroll--live",
          densityClass,
        )}
        role="list"
        aria-label="ترتيب الفرق"
      >
        {table}
      </div>
    </div>
  );
}
