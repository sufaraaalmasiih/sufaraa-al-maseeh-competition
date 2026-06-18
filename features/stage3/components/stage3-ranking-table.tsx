import { EmptyState } from "@/components/layout/empty-state";
import { ErrorState, LoadingState } from "@/components/layout/state-view";
import { CompetitionRankingBoard } from "@/components/competition/competition-ranking-board";
import { STAGE3_NAME } from "@/features/stage3/stage3-constants";
import type { RankedStage3Team } from "@/features/stage3/stage3-ranking";
import { cn } from "@/lib/utils";

interface Stage3RankingTableProps {
  teams: RankedStage3Team[];
  loading: boolean;
  error: string | null;
  variant: "facilitator" | "audience" | "team";
  title?: string;
  description?: string;
  embedded?: boolean;
  animate?: boolean;
  revealAscending?: boolean;
  layoutReorder?: boolean;
}

export function Stage3RankingTable({
  teams,
  loading,
  error,
  variant,
  title,
  description,
  embedded = false,
  animate = false,
  revealAscending = false,
  layoutReorder = false,
}: Stage3RankingTableProps) {
  const compact = variant === "audience" || variant === "team";
  const boardAnimate = (animate || variant === "team") && !revealAscending;

  if (loading) {
    return <LoadingState variant={embedded ? "inline" : "page"} />;
  }

  if (error) {
    if (embedded) {
      return <p className="competition-ranking-panel__embedded-empty">{error}</p>;
    }

    return <ErrorState title="تعذر تحميل الترتيب" description={error} />;
  }

  if (teams.length === 0) {
    if (embedded) {
      return <p className="competition-ranking-panel__embedded-empty">بانتظار تسجيل الفرق</p>;
    }

    return <EmptyState title="بانتظار تسجيل الفرق" />;
  }

  const board = (
    <CompetitionRankingBoard
      animate={boardAnimate}
      revealAscending={revealAscending}
      layoutReorder={layoutReorder || (boardAnimate && variant !== "facilitator")}
      bare={embedded}
      scoreLabel="نقاط المرحلة الثالثة"
      showGovernorate={!compact}
      teams={teams.map((team) => ({
        teamId: team.teamId,
        teamName: team.teamName,
        rank: team.rank,
        stageScore: team.stage3Score,
        governorate: team.governorate,
        logoUrl: team.logoUrl,
        totalScore: team.totalScore,
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
          variant === "audience" && "competition-ranking-panel--audience",
          !embedded && "mt-6",
        )}
      >
        <div className="competition-ranking-panel__header">
          {!embedded ? (
            <>
              <p className="competition-ranking-panel__kicker">{STAGE3_NAME}</p>
              <h3 className="competition-ranking-panel__title">
                {title ?? "ترتيب مرحلة على المحك"}
              </h3>
              <p className="competition-ranking-panel__desc">
                {description ?? "الترتيب حسب نقاط المرحلة الثالثة ثم المجموع ثم اسم الفريق."}
              </p>
            </>
          ) : (
            <h3 className="competition-ranking-panel__embedded-title">
              {title ?? "ترتيب مرحلة على المحك"}
            </h3>
          )}
        </div>
        {board}
      </div>
    );
  }

  return (
    <div className="glass-card-premium mt-6 overflow-hidden p-0">
      <div className="border-b px-5 py-4" style={{ borderBottomColor: "rgba(20,58,90,0.08)" }}>
        <h3 className="text-lg font-black text-[#143A5A]">
          {title ?? "ترتيب المرحلة الثالثة المباشر"}
        </h3>
        <p className="mt-1 text-sm font-semibold" style={{ color: "rgba(20,58,90,0.55)" }}>
          {description ?? "الترتيب حسب نقاط المرحلة الثالثة ثم المجموع ثم اسم الفريق."}
        </p>
      </div>
      <div className="px-4 py-4 sm:px-5">{board}</div>
    </div>
  );
}
