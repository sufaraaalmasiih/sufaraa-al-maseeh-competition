import { EmptyState } from "@/components/layout/empty-state";
import { ErrorState, LoadingState } from "@/components/layout/state-view";
import { AnimatedRankingRow } from "@/components/motion/animated-ranking-row";
import { useGradualReveal } from "@/hooks/use-gradual-reveal";
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
}: Stage3RankingTableProps) {
  const compact = variant === "audience" || variant === "team";
  const revealedTeams = useGradualReveal(teams, animate ? 720 : 0, {
    maxDurationMs: 6_000,
    minIntervalMs: 140,
  });
  const visibleTeams = animate ? revealedTeams : teams;
  const isRevealing = animate && visibleTeams.length < teams.length;

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

  if (compact) {
    const panel = (
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
              <p className="competition-ranking-panel__kicker">{STAGE3_NAME}</p>
              <h3 className="competition-ranking-panel__title">
                {title ?? "ترتيب مرحلة على المحك"}
              </h3>
              <p className="competition-ranking-panel__desc">
                {isRevealing
                  ? `جاري الإعلان... (${visibleTeams.length}/${teams.length})`
                  : (description ?? "الترتيب حسب نقاط المرحلة الثالثة ثم المجموع ثم اسم الفريق.")}
              </p>
            </>
          ) : (
            <>
              <h3 className="competition-ranking-panel__embedded-title">
                {title ?? "ترتيب مرحلة على المحك"}
              </h3>
              {isRevealing ? (
                <p className="competition-ranking-panel__embedded-desc">
                  جاري الإعلان... ({visibleTeams.length}/{teams.length})
                </p>
              ) : null}
            </>
          )}
        </div>
        <div className="competition-ranking-scroll competition-ranking-scroll--cards">
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
                <p className="competition-ranking-row__meta">المجموع: {team.totalScore}</p>
              </div>
              <div className="competition-ranking-row__score">
                <span className="competition-ranking-row__score-label">نقاط المرحلة</span>
                <span className="competition-ranking-row__score-value">{team.stage3Score}</span>
              </div>
            </AnimatedRankingRow>
          ))}
        </div>
      </div>
    );

    return panel;
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
      <div className="overflow-x-auto competition-ranking-scroll">
        <table className="competition-ranking-table w-full min-w-[640px] text-right text-sm">
          <thead className="bg-[#F3FAFF] text-[#143A5A]">
            <tr>
              <th className="px-4 py-3 font-bold">المركز</th>
              <th className="px-4 py-3 font-bold">الفريق</th>
              <th className="px-4 py-3 font-bold">نقاط المرحلة الثالثة</th>
              <th className="px-4 py-3 font-bold">المجموع</th>
            </tr>
          </thead>
          <tbody className="divide-y bg-white" style={{ borderColor: "rgba(35,136,196,0.1)" }}>
            {teams.map((team) => (
              <tr
                key={team.teamId}
                className={cn(
                  team.rank === 1 && "bg-[#FFF7DF]",
                  team.rank === 2 && "bg-[#F3FAFF]",
                  team.rank === 3 && "bg-[#F1F9E8]",
                )}
              >
                <td className="px-4 py-3 text-lg font-extrabold text-[#143A5A]">{team.rank}</td>
                <td className="px-4 py-3 font-bold text-[#143A5A]">{team.teamName}</td>
                <td className="px-4 py-3 text-xl font-extrabold text-[#2388C4]">
                  {team.stage3Score}
                </td>
                <td className="px-4 py-3 font-bold">{team.totalScore}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
