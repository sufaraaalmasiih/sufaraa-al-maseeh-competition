"use client";

import { useMemo } from "react";
import {
  assignCompetitionRanks,
  compareFinishSpeed,
} from "@/lib/competition-rank-assignment";
import { useTeamStatesSnapshot } from "@/features/gameflow/team-states-store";

export interface Stage4RankedTeam {
  teamId: string;
  teamName: string;
  governorate: string;
  logoUrl?: string | null;
  stage4Score: number;
  totalScore: number;
  streak: number;
  finishedAtMs?: number | null;
  rank: number;
}

export function useStage4Ranking() {
  const { docs, loading, error } = useTeamStatesSnapshot("main");

  const teams = useMemo(() => {
    const rows = docs.map((doc) => {
      const data = doc.data;
      const progress = data.progress as Record<string, unknown> | undefined;

      return {
        teamId: typeof data.teamId === "string" ? data.teamId : doc.id,
        teamName: typeof data.teamName === "string" ? data.teamName : "فريق بدون اسم",
        governorate: typeof data.governorate === "string" ? data.governorate : "غير محددة",
        logoUrl: typeof data.logoUrl === "string" ? data.logoUrl : null,
        stage4Score:
          data.stageScores && typeof (data.stageScores as Record<string, unknown>).stage4 === "number"
            ? (data.stageScores as Record<string, number>).stage4
            : 0,
        totalScore: typeof data.totalScore === "number" ? data.totalScore : 0,
        streak:
          data.stage4 && typeof (data.stage4 as Record<string, unknown>).streak === "number"
            ? (data.stage4 as Record<string, number>).streak
            : 0,
        finishedAtMs:
          typeof progress?.stage4FinishedAtMs === "number"
            ? progress.stage4FinishedAtMs
            : null,
      };
    });

    rows.sort((first, second) => {
      if (second.stage4Score !== first.stage4Score) {
        return second.stage4Score - first.stage4Score;
      }

      if (second.totalScore !== first.totalScore) {
        return second.totalScore - first.totalScore;
      }

      const bySpeed = compareFinishSpeed(first.finishedAtMs, second.finishedAtMs);
      if (bySpeed !== 0) {
        return bySpeed;
      }

      return first.teamName.localeCompare(second.teamName, "ar");
    });

    return assignCompetitionRanks(
      rows,
      (team) => `${team.stage4Score}|${team.totalScore}`,
    );
  }, [docs]);

  return { teams, loading, error };
}
