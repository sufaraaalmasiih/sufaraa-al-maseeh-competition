export type RevealResultsDensity = "spacious" | "regular" | "compact";

export function getRevealResultsDensity(teamCount: number): RevealResultsDensity {
  if (teamCount < 8) {
    return "spacious";
  }

  if (teamCount < 16) {
    return "regular";
  }

  return "compact";
}

export function getRevealResultsDensityClass(teamCount: number): string {
  return `reveal-results-card--density-${getRevealResultsDensity(teamCount)}`;
}
