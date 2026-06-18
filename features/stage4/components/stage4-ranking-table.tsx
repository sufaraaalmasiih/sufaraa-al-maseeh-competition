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
}

export function Stage4RankingTable({
  teams,
  loading,
  error,
  variant = "facilitator",
  embedded = false,
  animate = false,
}: Stage4RankingTableProps) {
  if (loading) {
    return <LoadingState variant="page" />;
  }

  if (error) {
    return <ErrorState title="تعذر تحميل الترتيب" description={error} />;
  }

  if (variant === "team" || variant === "audience") {
    const boardAnimate = animate || variant === "team";
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
        <CompetitionRankingBoard
          animate={boardAnimate}
          bare={embedded}
          scoreLabel="نقاط المرحلة"
          teams={teams.map((team, index) => ({
            teamId: team.teamId,
            teamName: team.teamName,
            rank: index + 1,
            stageScore: team.stage4Score,
            governorate: team.governorate,
            logoUrl: team.logoUrl,
            totalScore: team.totalScore,
            meta: `المجموع: ${team.totalScore} · التسلسل: ${team.streak}`,
          }))}
          variant={variant === "audience" ? "audience" : "team"}
        />
      </div>
    );

    return panel;
  }

  return (
    <div className="glass-card-premium mt-6 overflow-hidden p-0">
      <div className="border-b px-5 py-4" style={{ borderBottomColor: "rgba(20,58,90,0.08)" }}>
        <h3 className="text-lg font-black text-[#143A5A]">ترتيب {STAGE4_NAME}</h3>
      </div>
      <div className="overflow-x-auto competition-ranking-scroll">
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
