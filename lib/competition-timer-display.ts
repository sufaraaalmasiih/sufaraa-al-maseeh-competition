import type { CompetitionTimer } from "@/types";

/** Shared grace window for UI + server answer submission. */
export const ANSWER_SUBMIT_GRACE_MS = 3_000;

export function computeRemainingSeconds(
  timer: CompetitionTimer | null | undefined,
  now = Date.now(),
): number {
  if (!timer?.active) {
    return 0;
  }

  if (timer.paused) {
    return Math.max(0, Math.floor((timer.pausedRemainingMs ?? 0) / 1000));
  }

  if (!timer.endsAtMs) {
    return 0;
  }

  return Math.max(0, Math.floor((timer.endsAtMs - now) / 1000));
}

export function isTimerExpiredForUi(
  timer: CompetitionTimer | null | undefined,
  now = Date.now(),
): boolean {
  if (!timer?.active || timer.paused) {
    return false;
  }

  return computeRemainingSeconds(timer, now) <= 0;
}

export function isTimerExpiredForSubmit(
  timer: CompetitionTimer | null | undefined,
  now = Date.now(),
): boolean {
  if (!timer?.active || timer.paused) {
    return false;
  }

  if (!timer.endsAtMs) {
    return false;
  }

  return timer.endsAtMs <= now - ANSWER_SUBMIT_GRACE_MS;
}
