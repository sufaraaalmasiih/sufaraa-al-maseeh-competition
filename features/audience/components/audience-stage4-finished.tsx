"use client";

import { Stage4RankingTable } from "@/features/stage4/components/stage4-ranking-table";
import { STAGE4_NAME } from "@/features/stage4/stage4-constants";
import type { Stage4RankedTeam } from "@/features/stage4/use-stage4-ranking";
import { AudienceStageResultsGate } from "@/features/audience/components/audience-stage-results-gate";
import { AudienceStageScreenCard } from "@/features/audience/components/audience-stage-screen-card";

interface AudienceStage4FinishedAudienceProps {
  teams: Stage4RankedTeam[];
  loading: boolean;
  error: string | null;
}

export function AudienceStage4FinishedAudience({
  teams,
  loading,
  error,
}: AudienceStage4FinishedAudienceProps) {
  return (
    <AudienceStageResultsGate
      resetKey="stage4_finished"
      eyebrow="المرحلة الرابعة"
      countdownTitle="استعدوا لنتائج المرحلة الرابعة"
      countdownSubtitle="سيُعرض ترتيب فرق المرحلة الأخيرة خلال لحظات"
    >
      {(resultsReady) => (
        <AudienceStageScreenCard
          badge={STAGE4_NAME}
          title="انتهت المرحلة الرابعة"
          subtitle="نتائج المرحلة الرابعة — استعدوا للنتائج النهائية"
          tone="blue"
        >
          <Stage4RankingTable
            teams={teams}
            loading={loading}
            error={error}
            variant="audience"
            embedded
            animate={resultsReady}
          />
        </AudienceStageScreenCard>
      )}
    </AudienceStageResultsGate>
  );
}
