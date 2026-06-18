"use client";

import { EmptyState } from "@/components/layout/empty-state";
import { ErrorState, LoadingState } from "@/components/layout/state-view";
import { AnimatedRankingRow } from "@/components/motion/animated-ranking-row";
import { TeamLogoBadge } from "@/components/competition/team-logo-badge";
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
}

interface CompetitionRankingBoardProps {
  teams: CompetitionRankingEntry[];
  loading?: boolean;
  error?: string | null;
  scoreLabel?: string;
  animate?: boolean;
  variant?: "audience" | "team" | "embedded";
  emptyTitle?: string;
  className?: string;
  /** Skip outer panel wrapper when parent already provides layout chrome. */
  bare?: boolean;
}

function rankAccentClass(rank: number): string | undefined {
  if (rank === 1) return "competition-ranking-row--gold";
  if (rank === 2) return "competition-ranking-row--silver";
  if (rank === 3) return "competition-ranking-row--bronze";
  return undefined;
}

function buildMeta(team: CompetitionRankingEntry): string {
  if (team.meta) {
    return team.meta;
  }

  const parts: string[] = [];
  if (team.governorate) {
    parts.push(team.governorate);
  }
  if (typeof team.totalScore === "number") {
    parts.push(`المجموع: ${team.totalScore}`);
  }
  return parts.join(" · ") || "—";
}

export function CompetitionRankingBoard({
  teams,
  loading = false,
  error = null,
  scoreLabel = "نقطة",
  animate = false,
  variant = "audience",
  emptyTitle = "بانتظار تسجيل الفرق",
  className,
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

  const densityClass =
    teams.length > 12
      ? "competition-ranking-scroll--dense"
      : teams.length > 6
        ? "competition-ranking-scroll--medium"
        : "competition-ranking-scroll--comfortable";

  const list = (
    <div
      className={cn(
        "competition-ranking-scroll competition-ranking-scroll--cards competition-ranking-scroll--live",
        densityClass,
        bare && className,
      )}
      role="list"
      aria-label="ترتيب الفرق"
    >
      {teams.map((team, index) => (
        <AnimatedRankingRow
          key={team.teamId}
          index={index}
          animate={animate && variant === "audience"}
          variant={variant === "audience" ? "audience" : "default"}
          className={cn(
            "competition-ranking-row competition-ranking-row--card competition-ranking-row--with-logo",
            rankAccentClass(team.rank),
          )}
        >
          <span className="competition-ranking-row__rank">{team.rank}</span>
          <TeamLogoBadge
            className="competition-ranking-row__logo"
            logoUrl={team.logoUrl}
            teamName={team.teamName}
            variant="hud"
          />
          <div className="competition-ranking-row__team">
            <p className="competition-ranking-row__name">{team.teamName}</p>
            <p className="competition-ranking-row__meta">{buildMeta(team)}</p>
          </div>
          <div className="competition-ranking-row__score">
            <span className="competition-ranking-row__score-label">{scoreLabel}</span>
            <span className="competition-ranking-row__score-value">{team.stageScore}</span>
          </div>
        </AnimatedRankingRow>
      ))}
    </div>
  );

  if (bare) {
    return list;
  }

  return (
    <div
      className={cn(
        "competition-ranking-panel competition-ranking-panel--live",
        variant === "embedded" && "competition-ranking-panel--embedded",
        variant === "audience" && "competition-ranking-panel--audience",
        className,
      )}
    >
      {list}
    </div>
  );
}
