"use client";

import { getDocs } from "firebase/firestore";
import { onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";
import { teamStatesCollectionRef } from "@/firebase/firestore";

export interface FinalResultTeam {
  teamId: string;
  teamName: string;
  governorate: string;
  stage1: number;
  stage2: number;
  stage3: number;
  stage4: number;
  total: number;
  rank: number;
}

function num(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function normalize(id: string, data: Record<string, unknown>): Omit<FinalResultTeam, "rank"> {
  const stageScores = data.stageScores as Record<string, unknown> | undefined;
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
  };
}

function rankTeams(rows: Omit<FinalResultTeam, "rank">[]): FinalResultTeam[] {
  const sorted = [...rows].sort((first, second) => {
    if (second.total !== first.total) {
      return second.total - first.total;
    }
    return first.teamName.localeCompare(second.teamName, "ar");
  });
  return sorted.map((row, index) => ({ ...row, rank: index + 1 }));
}

export async function fetchFinalResultTeams(
  competitionId = "main",
): Promise<FinalResultTeam[]> {
  const snapshot = await getDocs(teamStatesCollectionRef(competitionId));
  const rows = snapshot.docs.map((item) => normalize(item.id, item.data()));
  return rankTeams(rows);
}

export function useFinalResults() {
  const [teams, setTeams] = useState<FinalResultTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return onSnapshot(
      teamStatesCollectionRef("main"),
      (snapshot) => {
        const rows = snapshot.docs.map((item) => normalize(item.id, item.data()));
        setTeams(rankTeams(rows));
        setError(null);
        setLoading(false);
      },
      () => {
        setError("تعذر تحميل النتائج النهائية.");
        setLoading(false);
      },
    );
  }, []);

  return { teams, loading, error };
}
