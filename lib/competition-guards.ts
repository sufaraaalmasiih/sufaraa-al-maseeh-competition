export const COMPETITION_FROZEN_MESSAGE =
  "المسابقة مجمّدة حالياً. انتظروا إشعار الميسّر.";
export const TIMER_PAUSED_MESSAGE =
  "المؤقت متوقف. انتظروا استئناف المسابقة.";

export function isCompetitionFrozen(
  gameFlow: Record<string, unknown> | undefined | null,
): boolean {
  return gameFlow?.competitionFrozen === true;
}

export function assertCompetitionNotFrozen(
  gameFlow: Record<string, unknown> | undefined | null,
): void {
  if (isCompetitionFrozen(gameFlow)) {
    throw new Error(COMPETITION_FROZEN_MESSAGE);
  }
}

export function isTimerPaused(
  timer: Record<string, unknown> | undefined | null,
): boolean {
  return timer?.paused === true;
}

export function assertTimerNotPaused(
  timer: Record<string, unknown> | undefined | null,
): void {
  if (isTimerPaused(timer)) {
    throw new Error(TIMER_PAUSED_MESSAGE);
  }
}

export function isAnsweringTimerExpired(
  timer: Record<string, unknown> | undefined | null,
  expectedStage: string,
  expectedPurpose: string,
  now = Date.now(),
): boolean {
  if (!timer || timer.active !== true) {
    return false;
  }

  if (timer.stage !== expectedStage || timer.purpose !== expectedPurpose) {
    return false;
  }

  if (timer.paused === true) {
    return false;
  }

  const endsAtMs = typeof timer.endsAtMs === "number" ? timer.endsAtMs : null;
  if (endsAtMs === null) {
    return false;
  }

  return endsAtMs <= now;
}

export function assertAnsweringTimerOpen(
  timer: Record<string, unknown> | undefined | null,
  expectedStage: string,
  expectedPurpose: string,
  expiredMessage: string,
  now = Date.now(),
  graceMs = 1500,
): void {
  assertTimerNotPaused(timer);

  if (isAnsweringTimerExpired(timer, expectedStage, expectedPurpose, now - graceMs)) {
    throw new Error(expiredMessage);
  }
}
