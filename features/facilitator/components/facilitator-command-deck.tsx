"use client";

import { Clock } from "lucide-react";
import type { FacilitatorPhasePlan } from "@/features/facilitator/facilitator-flow-plan";
import { FacilitatorHeroAction } from "@/features/facilitator/components/facilitator-hero-action";
import { FacilitatorManualJump } from "@/features/facilitator/components/facilitator-manual-jump";
import { FacilitatorTimerControls } from "@/features/facilitator/components/facilitator-timer-controls";
import { getTimerRingLabel } from "@/features/facilitator/facilitator-timer-labels";
import { cn } from "@/lib/utils";
import type { CompetitionTimer, GameFlowStatus } from "@/types";

interface FacilitatorCommandDeckProps {
  plan: FacilitatorPhasePlan;
  status: GameFlowStatus | null;
  timer: CompetitionTimer | null;
  timerActive: boolean;
  remainingSeconds: number;
  isExpired: boolean;
  showTimerControls?: boolean;
  readyCount: number | null;
  totalTeams: number;
  onAdvance: (plan: FacilitatorPhasePlan) => Promise<void>;
}

function formatClock(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function timerProgress(remainingSeconds: number, durationSeconds?: number): number {
  const total = durationSeconds && durationSeconds > 0 ? durationSeconds : 180;
  return Math.min(100, Math.max(0, (remainingSeconds / total) * 100));
}

export function FacilitatorCommandDeck({
  plan,
  status,
  timer,
  timerActive,
  remainingSeconds,
  isExpired,
  showTimerControls = false,
  readyCount,
  totalTeams,
  onAdvance,
}: FacilitatorCommandDeckProps) {
  const ringProgress = timerActive
    ? timerProgress(remainingSeconds, timer?.durationSeconds)
    : 0;
  const ringLabel = getTimerRingLabel(timer, timerActive, isExpired);

  return (
    <header className="flow-command">
      <div className="flow-command__intro">
        <div className="flow-command__titles">
          <h2 className="flow-command__stage">{plan.stageName}</h2>
          <p className="flow-command__phase">{plan.phaseLabel}</p>
        </div>
      </div>

      <div className="flow-command__deck">
        <FacilitatorHeroAction
          plan={plan}
          status={status}
          readyCount={readyCount}
          totalTeams={totalTeams}
          onAdvance={onAdvance}
          embedded
        />
        <FacilitatorManualJump status={status} embedded />
      </div>

      <div className="flow-command__timer-bar">
        <div className="flow-command__timer-row">
          <div
            className={cn(
              "flow-command__timer-ring",
              timerActive && "flow-command__timer-ring--live",
              isExpired && "flow-command__timer-ring--expired",
            )}
            aria-label={
              timerActive
                ? isExpired
                  ? "انتهى الوقت"
                  : `المتبقي ${formatClock(remainingSeconds)}`
                : "المؤقت متوقف"
            }
          >
            <svg viewBox="0 0 120 120" className="flow-command__ring-svg" aria-hidden>
              <circle cx="60" cy="60" r="52" className="flow-command__ring-bg" />
              {timerActive ? (
                <circle
                  cx="60"
                  cy="60"
                  r="52"
                  className="flow-command__ring-progress"
                  strokeDasharray={`${(ringProgress / 100) * 327} 327`}
                />
              ) : null}
            </svg>
            <div className="flow-command__ring-center">
              <Clock className="flow-command__ring-icon" aria-hidden />
              <span className="flow-command__ring-value">
                {timerActive
                  ? isExpired
                    ? "0:00"
                    : formatClock(remainingSeconds)
                  : "—"}
              </span>
              <span className="flow-command__ring-label">{ringLabel}</span>
            </div>
          </div>

          {showTimerControls ? (
            <FacilitatorTimerControls
              inline
              stageKey={plan.stageKey}
              timer={timer}
              remainingSeconds={remainingSeconds}
              isExpired={isExpired}
            />
          ) : null}
        </div>
      </div>
    </header>
  );
}
