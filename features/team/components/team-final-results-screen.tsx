"use client";

import { EmptyState } from "@/components/layout/empty-state";
import { ErrorState, LoadingState } from "@/components/layout/state-view";
import { FinalResultsRankingPanel } from "@/components/competition/final-results-ranking-panel";
import { useFinalResults } from "@/features/facilitator/use-final-results";

export function TeamFinalResultsScreen() {
  const { teams, loading, error } = useFinalResults();

  if (loading) {
    return <LoadingState variant="page" />;
  }

  if (error) {
    return <ErrorState title="تعذر تحميل النتائج" description={error} />;
  }

  return (
    <section className="competition-stage-screen competition-stage-screen--animated competition-stage-screen--final-results">
      <div className="competition-stage-screen__card glass-card-white">
        <span className="competition-stage-screen__badge competition-stage-screen__badge--blue">
          النتائج النهائية
        </span>
        <h2 className="competition-stage-screen__title">ترتيب المسابقة</h2>
        <p className="competition-stage-screen__subtitle">
          المجموع النهائي لجميع الفرق بعد المراحل الأربع
        </p>

        {teams.length === 0 ? (
          <EmptyState title="بانتظار تسجيل النتائج" />
        ) : (
          <FinalResultsRankingPanel teams={teams} animate />
        )}
      </div>
    </section>
  );
}
