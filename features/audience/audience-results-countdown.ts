export const AUDIENCE_RESULTS_COUNTDOWN_SECONDS = 5;

export function getAudienceResultsCountdownLabel(remaining: number): string {
  return remaining > 0 ? String(remaining) : "0";
}
