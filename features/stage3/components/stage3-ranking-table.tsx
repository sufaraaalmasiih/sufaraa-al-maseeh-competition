import { EmptyState } from "@/components/layout/empty-state";
import { ErrorState, LoadingState } from "@/components/layout/state-view";
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
}

export function Stage3RankingTable({
  teams,
  loading,
  error,
  variant,
  title,
  description,
  embedded = false,
}: Stage3RankingTableProps) {
  const compact = variant === "audience" || variant === "team";

  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState title="تعذر تحميل الترتيب" description={error} />;
  }

  if (teams.length === 0) {
    return <EmptyState title="بانتظار تسجيل الفرق" />;
  }

  if (compact) {
    const panel = (
      <div className={cn("competition-ranking-panel", embedded ? "mt-0" : "mt-6")}>
        <div className="competition-ranking-panel__header">
          <p className="text-sm font-bold text-[#4F8A10]">{STAGE3_NAME}</p>
          <h3 className="competition-ranking-panel__title">
            {title ?? "ترتيب مرحلة على المحك"}
          </h3>
          <p className="competition-ranking-panel__desc">
            {description ?? "الترتيب حسب نقاط المرحلة الثالثة ثم المجموع ثم اسم الفريق."}
          </p>
        </div>
        {teams.map((team) => (
          <div
            key={team.teamId}
            className={cn(
              "competition-ranking-row",
              team.rank === 1 && "competition-ranking-row--gold",
              team.rank === 2 && "competition-ranking-row--silver",
              team.rank === 3 && "competition-ranking-row--bronze",
            )}
          >
            <span className="competition-ranking-row__rank">{team.rank}</span>
            <div className="min-w-0 text-right">
              <p className="truncate text-base font-black text-[#143A5A] sm:text-lg">
                {team.teamName}
              </p>
              <p className="text-xs font-semibold sm:text-sm" style={{ color: "rgba(20,58,90,0.55)" }}>
                المرحلة: {team.stage3Score} — المجموع: {team.totalScore}
              </p>
            </div>
            <p className="text-2xl font-black text-[#2388C4] sm:text-3xl">{team.stage3Score}</p>
          </div>
        ))}
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
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-right text-sm">
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
