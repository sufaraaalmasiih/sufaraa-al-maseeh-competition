"use client";

import { getDocs } from "firebase/firestore";
import { useMemo } from "react";
import { teamStatesCollectionRef } from "@/firebase/firestore";
import {
  assignCompetitionRanks,
  compareFinishSpeed,
} from "@/lib/competition-rank-assignment";
import { useTeamStatesSnapshot } from "@/features/gameflow/team-states-store";

export interface FinalResultTeam {
  teamId: string;
  teamName: string;
  governorate: string;
  stage1: number;
  stage2: number;
  stage3: number;
  stage4: number;
  total: number;
  finishedAtMs: number | null;
  rank: number;
}

function num(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function latestFinishedAtMs(progress: Record<string, unknown> | undefined): number | null {
  if (!progress) {
    return null;
  }
  const stamps = [
    progress.stage1FinishedAtMs,
    progress.stage2FinishedAtMs,
    progress.stage3FinishedAtMs,
    progress.stage4FinishedAtMs,
  ].filter((value): value is number => typeof value === "number" && Number.isFinite(value));
  return stamps.length > 0 ? Math.max(...stamps) : null;
}

function normalize(id: string, data: Record<string, unknown>): Omit<FinalResultTeam, "rank"> {
  const stageScores = data.stageScores as Record<string, unknown> | undefined;
  const progress = data.progress as Record<string, unknown> | undefined;
  const stage1 = num(stageScores?.stage1);
  const stage2 = num(stageScores?.stage2);
  const stage3 = num(stageScores?.stage3);
  const stage4 = num(stageScores?.stage4);
  const storedTotal = num(data.totalScore);
  const summedTotal = stage1 + stage2 + stage3 + stage4;

  return {
    teamId: typeof data.teamId === "string" ? data.teamId : id,
    teamName: typeof data.teamName === "string" ? data.teamName : "فريق بدون اسم",
    governorate: typeof data.governorate === "string" ? data.governorate : "غير محددة",
    stage1,
    stage2,
    stage3,
    stage4,
    total: storedTotal || summedTotal,
    finishedAtMs: latestFinishedAtMs(progress),
  };
}

function rankTeams(rows: Omit<FinalResultTeam, "rank">[]): FinalResultTeam[] {
  const sorted = [...rows].sort((first, second) => {
    if (second.total !== first.total) {
      return second.total - first.total;
    }

    const bySpeed = compareFinishSpeed(first.finishedAtMs, second.finishedAtMs);
    if (bySpeed !== 0) {
      return bySpeed;
    }

    return first.teamName.localeCompare(second.teamName, "ar");
  });
  return assignCompetitionRanks(sorted, (row) => row.total);
}

export async function fetchFinalResultTeams(
  competitionId = "main",
): Promise<FinalResultTeam[]> {
  const snapshot = await getDocs(teamStatesCollectionRef(competitionId));
  const rows = snapshot.docs.map((item) => normalize(item.id, item.data()));
  return rankTeams(rows);
}

export function useFinalResults() {
  const { docs, loading, error } = useTeamStatesSnapshot("main");

  const teams = useMemo(
    () => rankTeams(docs.map((item) => normalize(item.id, item.data))),
    [docs],
  );

  return { teams, loading, error };
}
