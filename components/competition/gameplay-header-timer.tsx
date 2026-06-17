"use client";

import { cn } from "@/lib/utils";

interface GameplayHeaderTimerProps {
  label: string;
  remainingSeconds: number;
  durationSeconds: number;
  isExpired: boolean;
  paused?: boolean;
}

function formatTime(totalSeconds: number) {
  const safeSeconds = Math.max(0, totalSeconds);
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;

  return `${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}`;
}

export function GameplayHeaderTimer({
  label,
  remainingSeconds,
  isExpired,
  paused = false,
}: GameplayHeaderTimerProps) {
  const isUrgent = !isExpired && !paused && remainingSeconds > 0 && remainingSeconds <= 60;
  const statusLabel = paused ? "موقوف مؤقتاً" : isExpired ? "انتهى الوقت" : label;

  return (
    <div
      className={cn(
        "gameplay-header-timer",
        paused && "gameplay-header-timer--paused",
        isExpired && "gameplay-header-timer--expired",
        isUrgent && "gameplay-header-timer--urgent",
      )}
      aria-live="polite"
      aria-atomic="true"
      role="timer"
    >
      <span className="gameplay-header-timer__label">{statusLabel}</span>
      <span className="gameplay-header-timer__value">{formatTime(remainingSeconds)}</span>
    </div>
  );
}
