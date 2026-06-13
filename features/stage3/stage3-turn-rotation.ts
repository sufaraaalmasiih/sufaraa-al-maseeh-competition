export interface Stage3TurnTeam {
  teamId: string;
  teamName: string;
}

export function sortTeamsForStage3Turn(teams: Stage3TurnTeam[]): Stage3TurnTeam[] {
  return [...teams].sort((first, second) =>
    first.teamName.localeCompare(second.teamName, "ar"),
  );
}

export function getNextTurnIndex(currentIndex: number, teamCount: number): number {
  if (teamCount <= 0) {
    return 0;
  }

  return (Math.max(0, currentIndex) + 1) % teamCount;
}

export function resolveTurnTeam(
  teams: Stage3TurnTeam[],
  turnIndex: number,
): Stage3TurnTeam | null {
  const sorted = sortTeamsForStage3Turn(teams);

  if (sorted.length === 0) {
    return null;
  }

  const safeIndex = ((turnIndex % sorted.length) + sorted.length) % sorted.length;
  return sorted[safeIndex] ?? null;
}

export function findTurnIndexForTeam(
  teams: Stage3TurnTeam[],
  teamId: string,
): number {
  const sorted = sortTeamsForStage3Turn(teams);
  const index = sorted.findIndex((team) => team.teamId === teamId);
  return index < 0 ? 0 : index;
}

