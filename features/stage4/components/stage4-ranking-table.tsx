"use client";

import { ErrorState, LoadingState } from "@/components/layout/state-view";
import type { Stage4RankedTeam } from "@/features/stage4/use-stage4-ranking";
import { STAGE4_NAME } from "@/features/stage4/stage4-constants";
import { cn } from "@/lib/utils";

interface Stage4RankingTableProps {
  teams: Stage4RankedTeam[];
  loading: boolean;
  error: string | null;
  variant?: "team" | "facilitator" | "audience";
  embedded?: boolean;
}

export function Stage4RankingTable({
  teams,
  loading,
  error,
  variant = "facilitator",
  embedded = false,
}: Stage4RankingTableProps) {
  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState title="تعذر تحميل الترتيب" description={error} />;
  }

  if (variant === "team") {
    return (
      <div className={cn("competition-ranking-panel", embedded ? "mt-0" : "mt-6")}>
        <div className="competition-ranking-panel__header">
          <h3 className="competition-ranking-panel__title">ترتيب {STAGE4_NAME}</h3>
          <p className="competition-ranking-panel__desc">حسب نقاط المرحلة الرابعة</p>
        </div>
        {teams.map((team, index) => {
          const rank = index + 1;
          return (
            <div
              key={team.teamId}
              className={cn(
                "competition-ranking-row",
                rank === 1 && "competition-ranking-row--gold",
                rank === 2 && "competition-ranking-row--silver",
                rank === 3 && "competition-ranking-row--bronze",
              )}
            >
              <span className="competition-ranking-row__rank">{rank}</span>
              <div className="min-w-0 text-right">
                <p className="truncate text-base font-black text-[#143A5A] sm:text-lg">
                  {team.teamName}
                </p>
                <p className="text-xs font-semibold sm:text-sm" style={{ color: "rgba(20,58,90,0.55)" }}>
                  المجموع: {team.totalScore} — التسلسل: {team.streak}
                </p>
              </div>
              <p className="text-2xl font-black text-[#2388C4] sm:text-3xl">{team.stage4Score}</p>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="glass-card-premium mt-6 overflow-hidden p-0">
      <div className="border-b px-5 py-4" style={{ borderBottomColor: "rgba(20,58,90,0.08)" }}>
        <h3 className="text-lg font-black text-[#143A5A]">ترتيب {STAGE4_NAME}</h3>
        {variant === "audience" ? (
          <p className="mt-1 text-sm font-semibold" style={{ color: "rgba(20,58,90,0.55)" }}>
            عرض مباشر للجمهور
          </p>
        ) : null}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-right text-sm">
          <thead className="bg-[#F3FAFF] text-[#143A5A]">
            <tr>
              <th className="px-4 py-3 font-bold">#</th>
              <th className="px-4 py-3 font-bold">الفريق</th>
              <th className="px-4 py-3 font-bold">نقاط المرحلة</th>
              <th className="px-4 py-3 font-bold">المجموع</th>
              <th className="px-4 py-3 font-bold">التسلسل</th>
            </tr>
          </thead>
          <tbody className="divide-y bg-white" style={{ borderColor: "rgba(35,136,196,0.1)" }}>
            {teams.map((team, index) => (
              <tr key={team.teamId}>
                <td className="px-4 py-3">{index + 1}</td>
                <td className="px-4 py-3 font-bold text-[#143A5A]">{team.teamName}</td>
                <td className="px-4 py-3">{team.stage4Score}</td>
                <td className="px-4 py-3">{team.totalScore}</td>
                <td className="px-4 py-3">{team.streak}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
