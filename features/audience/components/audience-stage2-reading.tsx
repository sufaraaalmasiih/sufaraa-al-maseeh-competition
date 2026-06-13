"use client";

import { TimerCountdown } from "@/features/gameflow/components/timer-countdown";
import { GameFlowPlaceholder } from "@/features/gameflow/components/gameflow-placeholder";
import { useCompetitionTimer } from "@/features/gameflow/use-competition-timer";

export function AudienceStage2Reading() {
  const { timer, remainingSeconds, isExpired } = useCompetitionTimer();
  const hasReadingTimer = Boolean(
    timer?.active && timer.stage === "stage2" && timer.purpose === "reading",
  );

  return (
    <div className="space-y-6">
      <GameFlowPlaceholder
        title="الفرق تقرأ المرجع الكتابي"
        description="مرحلة فتشوا الكتب"
      />
      {hasReadingTimer ? (
        <TimerCountdown
          remainingSeconds={remainingSeconds}
          isExpired={isExpired}
          label="وقت قراءة المرجع"
        />
      ) : (
        <p className="rounded-lg border border-primary/15 bg-white px-5 py-4 text-center text-base font-bold text-[#143A5A]">
          بانتظار بدء مؤقت القراءة من الميسر
        </p>
      )}
    </div>
  );
}
