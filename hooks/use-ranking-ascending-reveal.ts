"use client";

import { useMemo } from "react";
import { useGradualReveal } from "@/hooks/use-gradual-reveal";

export interface RankingRevealTeam {
  teamId: string;
  rank: number;
}

export interface RankingAscendingRevealOptions {
  intervalMs?: number;
  maxDurationMs?: number;
  minIntervalMs?: number;
}

export function sortRankingWorstFirst<T extends RankingRevealTeam>(teams: T[]): T[] {
  return [...teams].sort((left, right) => right.rank - left.rank);
}

export function filterRankingByRevealedIds<T extends RankingRevealTeam>(
  teams: T[],
  revealedIds: ReadonlySet<string>,
): T[] {
  return teams.filter((team) => revealedIds.has(team.teamId));
}

/**
 * Reveals ranking rows from worst place to first while keeping display order (rank 1 at top).
 */
export function useRankingAscendingReveal<T extends RankingRevealTeam>(
  teams: T[],
  enabled: boolean,
  options: RankingAscendingRevealOptions = {},
): { visibleTeams: T[]; revealedCount: number; totalCount: number } {
  const worstFirst = useMemo(() => sortRankingWorstFirst(teams), [teams]);

  const intervalMs = options.intervalMs ?? 520;
  const revealedWorstFirst = useGradualReveal(worstFirst, enabled ? intervalMs : 0, {
    maxDurationMs: options.maxDurationMs ?? 12_000,
    minIntervalMs: options.minIntervalMs ?? 140,
  });

  const revealedIds = useMemo(
    () => new Set(revealedWorstFirst.map((team) => team.teamId)),
    [revealedWorstFirst],
  );

  const visibleTeams = useMemo(
    () => (enabled ? filterRankingByRevealedIds(teams, revealedIds) : teams),
    [enabled, revealedIds, teams],
  );

  return {
    visibleTeams,
    revealedCount: revealedWorstFirst.length,
    totalCount: teams.length,
  };
}
