"use client";

import { TimerCountdown } from "@/features/gameflow/components/timer-countdown";
import { useCompetitionTimer } from "@/features/gameflow/use-competition-timer";
import { Stage1RankingTable } from "@/features/stage1/components/stage1-ranking-table";
import { useStage1Ranking } from "@/features/stage1/use-stage1-ranking";

export function AudienceStage1Running() {
  const { timer, remainingSeconds, isExpired } = useCompetitionTimer();
  const { teams, loading, error } = useStage1Ranking();
  const hasStage1Timer = Boolean(timer?.active && timer.stage === "stage1");

  return (
    <div className="space-y-6">
      {hasStage1Timer ? (
        <TimerCountdown
          remainingSeconds={remainingSeconds}
          isExpired={isExpired}
          label="وقت المرحلة الأولى"
        />
      ) : (
        <div className="rounded-lg border border-primary/10 bg-white px-5 py-4 text-center text-base font-bold text-[#143A5A] shadow-[0_10px_28px_rgba(20,58,90,0.06)]">
          المرحلة الأولى قيد التنفيذ. لا يوجد مؤقت نشط حالياً.
        </div>
      )}
      <Stage1RankingTable
        teams={teams}
        loading={loading}
        error={error}
        variant="audience"
      />
    </div>
  );
}
