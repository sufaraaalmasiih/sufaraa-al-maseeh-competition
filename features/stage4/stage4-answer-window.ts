/** Minimum time teams must have to answer before facilitator can close (ms). */
export const STAGE4_MIN_ANSWER_WINDOW_MS = 8_000;

export function canCloseStage4AnswersNow(
  openedAtMs: number | null | undefined,
  nowMs: number,
): boolean {
  if (typeof openedAtMs !== "number" || openedAtMs <= 0) {
    return true;
  }
  return nowMs - openedAtMs >= STAGE4_MIN_ANSWER_WINDOW_MS;
}

export function stage4AnswerWindowRemainingMs(
  openedAtMs: number | null | undefined,
  nowMs: number,
): number {
  if (typeof openedAtMs !== "number" || openedAtMs <= 0) {
    return 0;
  }
  return Math.max(0, STAGE4_MIN_ANSWER_WINDOW_MS - (nowMs - openedAtMs));
}
