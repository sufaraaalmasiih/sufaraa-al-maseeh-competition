"use client";

import { ErrorState, LoadingState } from "@/components/layout/state-view";
import { CompetitionRankingBoard } from "@/components/competition/competition-ranking-board";
import type { Stage4RankedTeam } from "@/features/stage4/use-stage4-ranking";
import { STAGE4_NAME } from "@/features/stage4/stage4-constants";
import { cn } from "@/lib/utils";

interface Stage4RankingTableProps {
  teams: Stage4RankedTeam[];
  loading: boolean;
  error: string | null;
  variant?: "team" | "facilitator" | "audience";
  embedded?: boolean;
  animate?: boolean;
  revealAscending?: boolean;
  layoutReorder?: boolean;
}

export function Stage4RankingTable({
  teams,
  loading,
  error,
  variant = "facilitator",
  embedded = false,
  animate = false,
  revealAscending = false,
  layoutReorder = false,
}: Stage4RankingTableProps) {
  if (loading) {
    return <LoadingState variant="page" />;
  }

  if (error) {
    return <ErrorState title="تعذر تحميل الترتيب" description={error} />;
  }

  const compact = variant === "team" || variant === "audience";
  const boardAnimate = (animate || variant === "team") && !revealAscending;

  const board = (
    <CompetitionRankingBoard
      animate={boardAnimate}
      revealAscending={revealAscending}
      layoutReorder={layoutReorder || (boardAnimate && variant !== "facilitator")}
      bare={embedded}
      extraColumnLabel="التسلسل"
      scoreLabel="نقاط المرحلة"
      showExtraColumn={!compact}
      showGovernorate={!compact}
      teams={teams.map((team, index) => ({
        teamId: team.teamId,
        teamName: team.teamName,
        rank: index + 1,
        stageScore: team.stage4Score,
        governorate: team.governorate,
        logoUrl: team.logoUrl,
        totalScore: team.totalScore,
        extraValue: team.streak,
        meta: compact ? `المجموع: ${team.totalScore} · التسلسل: ${team.streak}` : undefined,
      }))}
      variant={compact ? (variant === "audience" ? "audience" : "team") : "facilitator"}
    />
  );

  if (compact) {
    return (
      <div
        className={cn(
          "competition-ranking-panel",
          embedded && "competition-ranking-panel--embedded",
          !embedded && "mt-6",
        )}
      >
        <div className="competition-ranking-panel__header">
          {!embedded ? (
            <>
              <p className="competition-ranking-panel__kicker">{STAGE4_NAME}</p>
              <h3 className="competition-ranking-panel__title">ترتيب {STAGE4_NAME}</h3>
              <p className="competition-ranking-panel__desc">
                {variant === "audience"
                  ? "عرض مباشر للجمهور — حسب نقاط المرحلة الرابعة"
                  : "حسب نقاط المرحلة الرابعة"}
              </p>
            </>
          ) : null}
        </div>
        {board}
      </div>
    );
  }

  return (
    <div className="glass-card-premium mt-6 overflow-hidden p-0">
      <div className="border-b px-5 py-4" style={{ borderBottomColor: "rgba(20,58,90,0.08)" }}>
        <h3 className="text-lg font-black text-[#143A5A]">ترتيب {STAGE4_NAME}</h3>
      </div>
      <div className="px-4 py-4 sm:px-5">{board}</div>
    </div>
  );
}
