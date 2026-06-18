"use client";

import { Stage3RankingTable } from "@/features/stage3/components/stage3-ranking-table";
import { STAGE3_NAME } from "@/features/stage3/stage3-constants";
import type { RankedStage3Team } from "@/features/stage3/stage3-ranking";
import { AudienceStageResultsGate } from "@/features/audience/components/audience-stage-results-gate";
import { AudienceStageScreenCard } from "@/features/audience/components/audience-stage-screen-card";

interface AudienceStage3FinishedAudienceProps {
  teams: RankedStage3Team[];
  loading: boolean;
  error: string | null;
}

export function AudienceStage3FinishedAudience({
  teams,
  loading,
  error,
}: AudienceStage3FinishedAudienceProps) {
  return (
    <AudienceStageResultsGate
      resetKey="stage3_finished"
      eyebrow="المرحلة الثالثة"
      countdownTitle="استعدوا لنتائج المرحلة الثالثة"
      countdownSubtitle="سيُعرض ترتيب فرق على المحك خلال لحظات"
    >
      {(resultsReady) => (
        <AudienceStageScreenCard
          badge={STAGE3_NAME}
          title="انتهت مرحلة على المحك"
          subtitle="ترتيب المرحلة الثالثة فقط — بدون النتائج النهائية للمسابقة"
        >
          <Stage3RankingTable
            teams={teams}
            loading={loading}
            error={error}
            variant="audience"
            embedded
            animate={resultsReady}
            revealAscending={resultsReady}
          />
        </AudienceStageScreenCard>
      )}
    </AudienceStageResultsGate>
  );
}
