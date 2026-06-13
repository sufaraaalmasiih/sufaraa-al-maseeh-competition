"use client";

import { useState } from "react";
import { Pause, Play, RotateCcw, Timer } from "lucide-react";
import { TimerCountdown } from "@/features/gameflow/components/timer-countdown";
import {
  pauseTimer,
  resetTimer,
  resumeTimer,
  startStage1Timer,
  startStage2AnsweringTimer,
  startStage2ReadingTimer,
} from "@/features/facilitator/facilitator-flow-actions";
import {
  getTimerPurposeLabel,
  getTimerStatusLabel,
} from "@/features/facilitator/facilitator-timer-labels";
import type { FacilitatorStageKey } from "@/features/facilitator/facilitator-flow-plan";
import type { CompetitionTimer } from "@/types";
import { cn } from "@/lib/utils";

interface FacilitatorTimerControlsProps {
  stageKey: FacilitatorStageKey;
  timer: CompetitionTimer | null;
  remainingSeconds: number;
  isExpired: boolean;
  compact?: boolean;
  inline?: boolean;
}

type TimerAction =
  | "start-stage1"
  | "start-reading"
  | "start-answering"
  | "pause"
  | "resume"
  | "reset";

export function FacilitatorTimerControls({
  stageKey,
  timer,
  remainingSeconds,
  isExpired,
  compact = false,
  inline = false,
}: FacilitatorTimerControlsProps) {
  const [pending, setPending] = useState<TimerAction | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(action: TimerAction, fn: () => Promise<void>) {
    setPending(action);
    setError(null);
    try {
      await fn();
    } catch {
      setError("تعذر تنفيذ إجراء المؤقت.");
    } finally {
      setPending(null);
    }
  }

  const showActiveCountdown =
    !compact &&
    !inline &&
    timer?.active &&
    (timer.stage === "stage1" || timer.stage === "stage2");

  const purposeLabel = getTimerPurposeLabel(timer);
  const statusLabel = getTimerStatusLabel(timer);

  const startButtons =
    stageKey === "stage1" || stageKey === "stage2" ? (
      <>
        {stageKey === "stage1" ? (
          <button
            type="button"
            className="facilitator-btn facilitator-btn--primary flow-timer__btn"
            disabled={pending !== null}
            onClick={() => void run("start-stage1", startStage1Timer)}
          >
            <Play className="flow-timer__btn-icon" aria-hidden />
            {pending === "start-stage1" ? "جاري البدء..." : "بدء المرحلة الأولى"}
          </button>
        ) : null}

        {stageKey === "stage2" ? (
          <>
            <button
              type="button"
              className="facilitator-btn facilitator-btn--primary flow-timer__btn"
              disabled={pending !== null}
              onClick={() => void run("start-reading", startStage2ReadingTimer)}
            >
              <Play className="flow-timer__btn-icon" aria-hidden />
              {pending === "start-reading" ? "جاري البدء..." : "مؤقت القراءة"}
            </button>
            <button
              type="button"
              className="facilitator-btn facilitator-btn--primary flow-timer__btn"
              disabled={pending !== null}
              onClick={() => void run("start-answering", startStage2AnsweringTimer)}
            >
              <Play className="flow-timer__btn-icon" aria-hidden />
              {pending === "start-answering" ? "جاري البدء..." : "مؤقت المجال"}
            </button>
          </>
        ) : null}
      </>
    ) : null;

  const transportButtons =
    timer?.active && !timer.paused ? (
      <button
        type="button"
        className="facilitator-btn facilitator-btn--outline flow-timer__btn flow-timer__btn--transport"
        disabled={pending !== null}
        onClick={() => void run("pause", pauseTimer)}
        title="إيقاف المؤقت مؤقتاً"
      >
        <Pause className="flow-timer__btn-icon" aria-hidden />
        <span>{pending === "pause" ? "..." : "توقف"}</span>
      </button>
    ) : timer?.active && timer.paused ? (
      <>
        <button
          type="button"
          className="facilitator-btn facilitator-btn--primary flow-timer__btn flow-timer__btn--transport"
          disabled={pending !== null}
          onClick={() => void run("resume", resumeTimer)}
          title="استئناف المؤقت"
        >
          <Play className="flow-timer__btn-icon" aria-hidden />
          <span>{pending === "resume" ? "..." : "إكمال"}</span>
        </button>
        <button
          type="button"
          className="facilitator-btn facilitator-btn--outline flow-timer__btn flow-timer__btn--transport"
          disabled={pending !== null}
          onClick={() => void run("reset", resetTimer)}
          title="إعادة المؤقت من البداية"
        >
          <RotateCcw className="flow-timer__btn-icon" aria-hidden />
          <span>{pending === "reset" ? "..." : "ضبط"}</span>
        </button>
      </>
    ) : null;

  if (inline) {
    const isLive = Boolean(timer?.active && !timer.paused);

    return (
      <div className="flow-timer flow-timer--inline">
        <div className="flow-timer__inline-shell">
          {transportButtons ? (
            <div className="flow-timer__inline-toolbar">
              {startButtons ? (
                <div className="flow-timer__inline-group flow-timer__inline-group--start">
                  {startButtons}
                </div>
              ) : null}

              <div className="flow-timer__inline-group flow-timer__inline-group--transport">
                {transportButtons}
              </div>
            </div>
          ) : startButtons ? (
            <div className="flow-timer__inline-toolbar">
              <div className="flow-timer__inline-group flow-timer__inline-group--start">
                {startButtons}
              </div>
            </div>
          ) : null}

          {timer?.active ? (
            <>
              <span className="flow-timer__inline-divider" aria-hidden />
              <div className="flow-timer__inline-status">
                <span
                  className={cn(
                    "flow-timer__badge",
                    isLive && "flow-timer__badge--live",
                    timer.paused && "flow-timer__badge--paused",
                  )}
                >
                  {statusLabel}
                </span>
              </div>
            </>
          ) : null}
        </div>
        {error ? <p className="facilitator-inline-error">{error}</p> : null}
      </div>
    );
  }

  return (
    <div className={cn("flow-timer", compact && "flow-timer--compact")}>
      <div className="flow-timer__head">
        <Timer className="flow-timer__icon" aria-hidden />
        <div>
          <h3 className="flow-timer__title">
            {compact ? "تحكم المؤقت" : "المؤقت المركزي"}
          </h3>
          {!compact ? (
            <p className="flow-timer__desc">
              كل الشاشات تقرأ المؤقت من هنا — لا مؤقت مستقل عند الفرق.
            </p>
          ) : null}
        </div>
        <div className="flow-timer__badges">
          <span className="flow-timer__badge">{statusLabel}</span>
          {purposeLabel ? (
            <span className="flow-timer__badge flow-timer__badge--accent">{purposeLabel}</span>
          ) : null}
        </div>
      </div>

      {showActiveCountdown ? (
        <TimerCountdown
          remainingSeconds={remainingSeconds}
          isExpired={isExpired}
          paused={timer?.paused}
          label="المؤقت النشط"
        />
      ) : null}

      <div className="flow-timer__buttons">
        {startButtons}
        {transportButtons}
      </div>

      {error ? <p className="facilitator-inline-error">{error}</p> : null}
    </div>
  );
}
