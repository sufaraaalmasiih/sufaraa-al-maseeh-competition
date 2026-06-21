"use client";

import { EmptyState } from "@/components/layout/empty-state";
import { ErrorState, LoadingState } from "@/components/layout/state-view";
import {
  CompetitionRankingTable,
  type CompetitionRankingTableEntry,
} from "@/components/competition/competition-ranking-table";
import { useTeamLogosMap } from "@/features/gameflow/team-logos-store";
import { useAutoScrollFit } from "@/hooks/use-auto-scroll-fit";
import { resolveTeamLogoUrl } from "@/lib/resolve-team-logo-url";
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
  revealAscending?: boolean;
  layoutReorder?: boolean;
  variant?: "audience" | "team" | "embedded" | "facilitator";
  emptyTitle?: string;
  className?: string;
  title?: string;
  subtitle?: string;
  extraColumnLabel?: string;
  showGovernorate?: boolean;
  showExtraColumn?: boolean;
  showTotalScore?: boolean;
  dualColumnMinTeams?: number;
  /** Skip outer panel wrapper when parent already provides layout chrome. */
  bare?: boolean;
  /**
   * شاشة الجمهور فقط: عند تجاوز عدد الفرق للمساحة المتاحة، تمرّر اللوحة تلقائياً
   * ببطء لإظهار كل الفرق (لا تتأثّر الأعداد القليلة). تُفعَّل في النتائج النهائية.
   */
  autoFit?: boolean;
}

function toTableEntries(
  teams: CompetitionRankingEntry[],
  logosMap: ReadonlyMap<string, string>,
): CompetitionRankingTableEntry[] {
  return teams.map((team) => ({
    teamId: team.teamId,
    teamName: team.teamName,
    rank: team.rank,
    stageScore: team.stageScore,
    governorate: team.governorate,
    logoUrl: resolveTeamLogoUrl(team.teamId, team.logoUrl, logosMap),
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
  revealAscending = false,
  layoutReorder = false,
  variant = "audience",
  emptyTitle = "بانتظار تسجيل الفرق",
  className,
  title,
  subtitle,
  extraColumnLabel,
  showGovernorate = true,
  showExtraColumn = false,
  showTotalScore = true,
  dualColumnMinTeams = 8,
  bare = false,
  autoFit = false,
}: CompetitionRankingBoardProps) {
  const logosMap = useTeamLogosMap();
  const { viewportRef, contentRef } = useAutoScrollFit(teams.length);

  if (loading) {
    return <LoadingState variant="inline" />;
  }

  if (error) {
    return <ErrorState title="تعذر تحميل الترتيب" description={error} />;
  }

  if (teams.length === 0) {
    return <EmptyState title={emptyTitle} />;
  }

  const isAudience = variant === "audience";
  const compact = isAudience || variant === "team" || variant === "embedded";
  const isLiveBoard = animate && !revealAscending;
  const shouldLayoutReorder =
    layoutReorder || (isLiveBoard && (isAudience || variant === "team" || variant === "facilitator"));
  const densityClass =
    teams.length > 12
      ? "competition-ranking-scroll--dense"
      : teams.length > 6
        ? "competition-ranking-scroll--medium"
        : "competition-ranking-scroll--comfortable";

  const table = (
    <CompetitionRankingTable
      animate={isLiveBoard || variant === "team"}
      revealAscending={revealAscending}
      layoutReorder={shouldLayoutReorder}
      audience={isAudience}
      className={cn(bare && className)}
      compact={compact}
      dualColumnMinTeams={dualColumnMinTeams}
      extraColumnLabel={extraColumnLabel}
      scoreLabel={scoreLabel}
      showExtraColumn={showExtraColumn}
      showGovernorate={showGovernorate}
      showTotalScore={showTotalScore}
      subtitle={subtitle}
      teams={toTableEntries(teams, logosMap)}
      title={title}
    />
  );

  const scrollClass = cn(
    "competition-ranking-scroll competition-ranking-scroll--cards competition-ranking-scroll--live",
    isAudience && "competition-ranking-scroll--audience",
    densityClass,
  );

  const board = (
    <div className={scrollClass} role="list" aria-label="ترتيب الفرق">
      {table}
    </div>
  );

  // شاشة الجمهور (البروجكتر لا يتمرّر): لفّ كل لوحات ترتيب الجمهور بإطار يتحجّم
  // تلقائياً ليملأ الارتفاع المتاح ويُظهر كل الفرق. الأعداد القليلة تبقى بحجمها
  // الطبيعي (بلا تحجيم) فلا تتأثّر التجربة المعتادة. (`autoFit` يبقى للتوضيح.)
  const useAutoFit = autoFit || isAudience;
  const boardNode = useAutoFit ? (
    <div ref={viewportRef} className="competition-ranking-autofit">
      <div ref={contentRef} className="competition-ranking-autofit__inner">
        {board}
      </div>
    </div>
  ) : (
    board
  );

  if (bare) {
    return boardNode;
  }

  return (
    <div
      className={cn(
        "competition-ranking-panel competition-ranking-panel--live competition-ranking-panel--table",
        variant === "embedded" && "competition-ranking-panel--embedded",
        isAudience && "competition-ranking-panel--audience",
        className,
      )}
    >
      {boardNode}
    </div>
  );
}
