"use client";

import { useMemo } from "react";
import { EmptyState } from "@/components/layout/empty-state";
import { ErrorState, LoadingState } from "@/components/layout/state-view";
import { useStage1Ranking } from "@/features/stage1/use-stage1-ranking";
import { cn } from "@/lib/utils";

export function TeamFinalResultsScreen() {
  const { teams, loading, error } = useStage1Ranking();

  const rankedByTotal = useMemo(
    () =>
      [...teams]
        .sort((first, second) => {
          if (second.totalScore !== first.totalScore) {
            return second.totalScore - first.totalScore;
          }
          return first.teamName.localeCompare(second.teamName, "ar");
        })
        .map((team, index) => ({ ...team, rank: index + 1 })),
    [teams],
  );

  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState title="تعذر تحميل النتائج" description={error} />;
  }

  return (
    <section className="competition-stage-screen">
      <div className="competition-stage-screen__card glass-card-white">
        <span className="competition-stage-screen__badge competition-stage-screen__badge--blue">
          النتائج النهائية
        </span>
        <h2 className="competition-stage-screen__title">ترتيب المسابقة</h2>
        <p className="competition-stage-screen__subtitle">
          المجموع النهائي لجميع الفرق بعد المراحل الأربع
        </p>

        {rankedByTotal.length === 0 ? (
          <EmptyState title="بانتظار تسجيل النتائج" />
        ) : (
          <div className="competition-ranking-panel">
            <div className="competition-ranking-panel__header">
              <h3 className="competition-ranking-panel__title">الترتيب العام</h3>
              <p className="competition-ranking-panel__desc">حسب المجموع الكلي</p>
            </div>
            {rankedByTotal.map((team) => (
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
                    {team.governorate}
                  </p>
                </div>
                <p className="text-2xl font-black text-[#2388C4] sm:text-3xl">{team.totalScore}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
