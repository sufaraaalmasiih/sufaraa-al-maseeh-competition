"use client";



import { Stage2RankingTable } from "@/features/stage2/components/stage2-ranking-table";

import { useStage2Ranking } from "@/features/stage2/use-stage2-ranking";

import { AudienceStageResultsGate } from "@/features/audience/components/audience-stage-results-gate";

import { AudienceStageScreenCard } from "@/features/audience/components/audience-stage-screen-card";



export function AudienceStage2Finished() {

  const { teams, loading, error } = useStage2Ranking();



  return (

    <AudienceStageResultsGate

      resetKey="stage2_finished"

      eyebrow="المرحلة الثانية"

      countdownTitle="استعدوا لنتائج المرحلة الثانية"

      countdownSubtitle="سيُعرض ترتيب فرق فتشوا الكتب خلال لحظات"

    >

      {(resultsReady) => (

        <AudienceStageScreenCard

          badge="فتشوا الكتب"

          title="نتائج المرحلة الثانية"

          subtitle="ترتيب الفرق حسب نقاط فتشوا الكتب"

        >

          <Stage2RankingTable

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

