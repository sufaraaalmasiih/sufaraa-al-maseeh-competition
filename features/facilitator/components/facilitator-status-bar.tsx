"use client";

import { Clock, Flag, ListChecks, Users } from "lucide-react";
import type { FacilitatorPhasePlan } from "@/features/facilitator/facilitator-flow-plan";

interface FacilitatorStatusBarProps {
  plan: FacilitatorPhasePlan;
  timerActive: boolean;
  remainingSeconds: number;
  isExpired: boolean;
  readyCount: number | null;
  totalTeams: number;
  contextLabel: string | null;
}

function formatClock(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function FacilitatorStatusBar({
  plan,
  timerActive,
  remainingSeconds,
  isExpired,
  readyCount,
  totalTeams,
  contextLabel,
}: FacilitatorStatusBarProps) {
  return (
    <div className="facilitator-status-bar">
      <div className="facilitator-status-bar__main">
        <span className="facilitator-status-bar__stage">
          <Flag className="h-4 w-4" aria-hidden />
          {plan.stageName}
        </span>
        <span className="facilitator-status-bar__phase">{plan.phaseLabel}</span>
      </div>

      <div className="facilitator-status-bar__meta">
        <span className="facilitator-status-chip">
          <Clock className="h-4 w-4" aria-hidden />
          {timerActive
            ? isExpired
              ? "انتهى الوقت"
              : formatClock(remainingSeconds)
            : "المؤقت متوقف"}
        </span>

        {readyCount !== null ? (
          <span
            className={
              readyCount >= totalTeams && totalTeams > 0
                ? "facilitator-status-chip facilitator-status-chip--ready"
                : "facilitator-status-chip"
            }
          >
            <ListChecks className="h-4 w-4" aria-hidden />
            جاهز {readyCount} / {totalTeams}
          </span>
        ) : null}

        {contextLabel ? (
          <span className="facilitator-status-chip">
            <Users className="h-4 w-4" aria-hidden />
            {contextLabel}
          </span>
        ) : null}
      </div>
    </div>
  );
}
