"use client";

import { useMemo } from "react";
import { useTeamStatesSnapshot } from "@/features/gameflow/team-states-store";

export interface Stage4RankedTeam {
  teamId: string;
  teamName: string;
  governorate: string;
  stage4Score: number;
  totalScore: number;
  streak: number;
}

export function useStage4Ranking() {
  const { docs, loading, error } = useTeamStatesSnapshot("main");

  const teams = useMemo(() => {
    const rows = docs.map((doc) => {
      const data = doc.data;

      return {
        teamId: typeof data.teamId === "string" ? data.teamId : doc.id,
        teamName: typeof data.teamName === "string" ? data.teamName : "فريق بدون اسم",
        governorate: typeof data.governorate === "string" ? data.governorate : "غير محددة",
        stage4Score:
          data.stageScores && typeof (data.stageScores as Record<string, unknown>).stage4 === "number"
            ? (data.stageScores as Record<string, number>).stage4
            : 0,
        totalScore: typeof data.totalScore === "number" ? data.totalScore : 0,
        streak:
          data.stage4 && typeof (data.stage4 as Record<string, unknown>).streak === "number"
            ? (data.stage4 as Record<string, number>).streak
            : 0,
      };
    });

    rows.sort((first, second) => {
      if (second.stage4Score !== first.stage4Score) {
        return second.stage4Score - first.stage4Score;
      }

      return first.teamName.localeCompare(second.teamName, "ar");
    });

    return rows;
  }, [docs]);

  return { teams, loading, error };
}
