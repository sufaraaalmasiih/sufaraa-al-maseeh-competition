"use client";

import { Stage2RankingTable } from "@/features/stage2/components/stage2-ranking-table";
import { useStage2Ranking } from "@/features/stage2/use-stage2-ranking";

export function AudienceStage2Finished() {
  const { teams, loading, error } = useStage2Ranking();

  return (
    <Stage2RankingTable
      teams={teams}
      loading={loading}
      error={error}
      variant="audience"
      title="نتائج مرحلة فتشوا الكتب"
      description="نتائج المرحلة الثانية حسب نقاط فتشوا الكتب."
    />
  );
}
