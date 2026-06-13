"use client";

import { Stage1RankingTable } from "@/features/stage1/components/stage1-ranking-table";
import { useStage1Ranking } from "@/features/stage1/use-stage1-ranking";

export function AudienceStage1Finished() {
  const { teams, loading, error } = useStage1Ranking();

  return (
    <Stage1RankingTable
      teams={teams}
      loading={loading}
      error={error}
      variant="audience"
      title="نتائج مرحلة اجمعوا الكنوز"
      description="نتائج المرحلة الأولى حسب نقاط اجمعوا الكنوز."
    />
  );
}
