export interface Stage3TurnOrderEntry {
  teamId: string;
  teamName: string;
  totalScoreAtStart: number;
}

export interface Stage3TurnTeamSnapshot {
  teamId: string;
  teamName: string;
  totalScore: number;
}

/** Rank at Stage 3 start: highest totalScore → teamName (ar) → teamId */
export function buildStage3TurnOrder(
  teams: Stage3TurnTeamSnapshot[],
): Stage3TurnOrderEntry[] {
  return [...teams]
    .sort((first, second) => {
      if (second.totalScore !== first.totalScore) {
        return second.totalScore - first.totalScore;
      }

      const nameCompare = first.teamName.localeCompare(second.teamName, "ar");
      if (nameCompare !== 0) {
        return nameCompare;
      }

      return first.teamId.localeCompare(second.teamId);
    })
    .map((team) => ({
      teamId: team.teamId,
      teamName: team.teamName,
      totalScoreAtStart: team.totalScore,
    }));
}

export function parseStage3TurnOrder(value: unknown): Stage3TurnOrderEntry[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    if (!item || typeof item !== "object") {
      return [];
    }

    const data = item as Record<string, unknown>;

    if (typeof data.teamId !== "string" || typeof data.teamName !== "string") {
      return [];
    }

    return [
      {
        teamId: data.teamId,
        teamName: data.teamName,
        totalScoreAtStart:
          typeof data.totalScoreAtStart === "number" ? data.totalScoreAtStart : 0,
      },
    ];
  });
}

export function resolveOwnerFromTurnOrder(
  turnOrder: Stage3TurnOrderEntry[],
  turnIndex: number,
): Stage3TurnOrderEntry | null {
  if (turnOrder.length === 0) {
    return null;
  }

  const safeIndex = ((turnIndex % turnOrder.length) + turnOrder.length) % turnOrder.length;
  return turnOrder[safeIndex] ?? null;
}

export function findTurnIndexInOrder(turnOrder: Stage3TurnOrderEntry[], teamId: string): number {
  const index = turnOrder.findIndex((entry) => entry.teamId === teamId);
  return index < 0 ? 0 : index;
}

export function getNextTurnIndex(currentIndex: number, teamCount: number): number {
  if (teamCount <= 0) {
    return 0;
  }

  return (Math.max(0, currentIndex) + 1) % teamCount;
}
