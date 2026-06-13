/** Set true only while diagnosing /team loading. Must stay false in production. */
export const TEAM_DEBUG_ENABLED = false;

export function teamDebug(message: string, details?: Record<string, unknown>): void {
  if (!TEAM_DEBUG_ENABLED) {
    return;
  }

  if (details) {
    console.info(`[TEAM DEBUG] ${message}`, details);
    return;
  }

  console.info(`[TEAM DEBUG] ${message}`);
}
