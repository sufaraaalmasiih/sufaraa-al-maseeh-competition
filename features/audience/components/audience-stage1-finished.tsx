"use client";

import { Stage1RankingTable } from "@/features/stage1/components/stage1-ranking-table";
import { useStage1Ranking } from "@/features/stage1/use-stage1-ranking";
import { AudienceStageResultsGate } from "@/features/audience/components/audience-stage-results-gate";
import { AudienceStageScreenCard } from "@/features/audience/components/audience-stage-screen-card";

export function AudienceStage1Finished() {
  const { teams, loading, error } = useStage1Ranking();

  return (
    <AudienceStageResultsGate
      resetKey="stage1_finished"
      eyebrow="المرحلة الأولى"
      countdownTitle="استعدوا لنتائج المرحلة الأولى"
      countdownSubtitle="سيُعرض ترتيب فرق اجمعوا الكنوز خلال لحظات"
    >
      {(resultsReady) => (
        <AudienceStageScreenCard
          badge="اجمعوا الكنوز"
          title="نتائج المرحلة الأولى"
          subtitle="ترتيب الفرق حسب نقاط اجمعوا الكنوز"
        >
          <Stage1RankingTable
            teams={teams}
            loading={loading}
            error={error}
            variant="audience"
            hideHeader
            animate={resultsReady}
            revealAscending={resultsReady}
          />
        </AudienceStageScreenCard>
      )}
    </AudienceStageResultsGate>
  );
}
