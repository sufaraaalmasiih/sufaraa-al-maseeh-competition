"use client";

import { useMemo } from "react";
import { EmptyState } from "@/components/layout/empty-state";
import { ErrorState, LoadingState } from "@/components/layout/state-view";
import { CompetitionPodium } from "@/components/competition/competition-podium";
import { useStage1Ranking } from "@/features/stage1/use-stage1-ranking";

export function TeamPodiumScreen() {
  const { teams, loading, error } = useStage1Ranking();

  const topThree = useMemo(
    () =>
      [...teams]
        .sort((first, second) => second.totalScore - first.totalScore)
        .slice(0, 3),
    [teams],
  );

  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState title="تعذر تحميل المنصة" description={error} />;
  }

  return (
    <section className="competition-stage-screen">
      <div className="competition-stage-screen__card glass-card-white">
        <span className="competition-stage-screen__badge">منصة الفائزين</span>
        <h2 className="competition-stage-screen__title">مبارك للفائزين!</h2>
        <p className="competition-stage-screen__subtitle">أفضل ثلاثة فرق في المسابقة</p>

        {topThree.length === 0 ? (
          <EmptyState title="بانتظار النتائج النهائية" />
        ) : (
          <CompetitionPodium
            showHeader={false}
            teams={topThree.map((team) => ({
              teamId: team.teamId,
              teamName: team.teamName,
              score: team.totalScore,
            }))}
          />
        )}
      </div>
    </section>
  );
}
