"use client";

import { useMemo } from "react";
import {
  getStage2Ranking,
  type RankedStage2Team,
  type Stage2RankingTeam,
} from "@/features/stage2/stage2-ranking";
import { useTeamStatesSnapshot } from "@/features/gameflow/team-states-store";

function normalizeTeamState(
  id: string,
  data: Record<string, unknown>,
): Stage2RankingTeam {
  const stageScores = data.stageScores as Record<string, unknown> | undefined;

  return {
    teamId: typeof data.teamId === "string" ? data.teamId : id,
    teamName: typeof data.teamName === "string" ? data.teamName : "فريق بدون اسم",
    governorate:
      typeof data.governorate === "string" ? data.governorate : "غير محددة",
    logoUrl: typeof data.logoUrl === "string" ? data.logoUrl : null,
    ready: data.ready === true,
    stage2Score: typeof stageScores?.stage2 === "number" ? stageScores.stage2 : 0,
    totalScore: typeof data.totalScore === "number" ? data.totalScore : 0,
  };
}

export function useStage2Ranking() {
  const { docs, loading, error } = useTeamStatesSnapshot("main");

  const teams = useMemo(
    () =>
      getStage2Ranking(
        docs.map((item) => normalizeTeamState(item.id, item.data)),
      ),
    [docs],
  );

  return { teams, loading, error };
}
