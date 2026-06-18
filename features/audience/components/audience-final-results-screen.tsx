"use client";



import { EmptyState } from "@/components/layout/empty-state";

import { ErrorState, LoadingState } from "@/components/layout/state-view";

import { FinalResultsRankingPanel } from "@/components/competition/final-results-ranking-panel";

import { AudienceStageResultsGate } from "@/features/audience/components/audience-stage-results-gate";

import { AudienceStageScreenCard } from "@/features/audience/components/audience-stage-screen-card";

import { useFinalResults } from "@/features/facilitator/use-final-results";



export function AudienceFinalResultsScreen() {

  const { teams, loading, error } = useFinalResults();



  if (loading) {

    return <LoadingState variant="page" />;

  }



  if (error) {

    return <ErrorState title="تعذر تحميل النتائج" description={error} />;

  }



  return (

    <AudienceStageResultsGate

      resetKey="final_results"

      eyebrow="ختام المسابقة"

      countdownTitle="استعدوا للنتائج النهائية"

      countdownSubtitle="سيُعرض الترتيب الكامل لجميع الفرق خلال لحظات"

    >

      {(resultsReady) => (

        <AudienceStageScreenCard

          badge="النتائج النهائية"

          title="ترتيب المسابقة"

          subtitle="المجموع النهائي لجميع الفرق بعد المراحل الأربع"

          tone="blue"

          screenClassName="competition-stage-screen--final-results audience-final-screen"

        >

          {teams.length === 0 ? (

            <EmptyState title="بانتظار تسجيل النتائج" />

          ) : (

            <FinalResultsRankingPanel
              teams={teams}
              animate={resultsReady}
              revealAscending={resultsReady}
              variant="audience"
            />

          )}

        </AudienceStageScreenCard>

      )}

    </AudienceStageResultsGate>

  );

}

