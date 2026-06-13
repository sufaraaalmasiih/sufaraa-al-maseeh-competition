"use client";

import { BookOpen } from "lucide-react";
import { StageHeaderBar } from "@/components/competition/stage-header-bar";
import { TimerCountdown } from "@/features/gameflow/components/timer-countdown";
import { STAGE2_NAME } from "@/features/stage2/stage2-constants";
import { useCompetitionTimer } from "@/features/gameflow/use-competition-timer";

export function Stage2ReadingScreen() {
  const { timer, remainingSeconds, isExpired } = useCompetitionTimer();
  const hasReadingTimer = Boolean(
    timer?.active && timer.stage === "stage2" && timer.purpose === "reading",
  );

  return (
    <div className="gameplay-stack text-center">
      <StageHeaderBar segments={[{ text: STAGE2_NAME, accent: true }]} />
      <div className="gameplay-board-card mx-auto max-w-2xl space-y-5 px-6 py-8">
        <div aria-hidden className="competition-stage-screen__icon mx-auto mt-0">
          <BookOpen className="h-8 w-8" strokeWidth={2.2} />
        </div>
        <div className="competition-hero-verse-panel">
          <p className="competition-hero-verse-text">يوحنا 15: 1-17</p>
        </div>
        <p className="text-base font-black text-[#143A5A] sm:text-xl">
          افتحوا الإنجيل واقرأوا المرجع بتأنٍ
        </p>
        {hasReadingTimer ? (
          <TimerCountdown
            remainingSeconds={remainingSeconds}
            isExpired={isExpired}
            paused={timer?.paused}
            label="وقت قراءة المرجع"
          />
        ) : (
          <div className="competition-stage-screen__wait border-t-0 pt-0">
            <span aria-hidden className="competition-stage-screen__wait-pulse" />
            <p className="competition-stage-screen__wait-title">بانتظار بدء المؤقت</p>
            <p className="competition-stage-screen__wait-hint">
              سيبدأ مؤقت القراءة عندما يوجّهكم الميسر
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
