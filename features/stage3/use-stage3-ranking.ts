"use client";

import { useMemo } from "react";
import {
  getStage3Ranking,
  type RankedStage3Team,
  type Stage3RankingTeam,
} from "@/features/stage3/stage3-ranking";
import { useTeamStatesSnapshot } from "@/features/gameflow/team-states-store";

function normalizeTeamState(
  id: string,
  data: Record<string, unknown>,
): Stage3RankingTeam {
  const stageScores = data.stageScores as Record<string, unknown> | undefined;

  return {
    teamId: typeof data.teamId === "string" ? data.teamId : id,
    teamName: typeof data.teamName === "string" ? data.teamName : "فريق بدون اسم",
    governorate:
      typeof data.governorate === "string" ? data.governorate : "غير محددة",
    logoUrl: typeof data.logoUrl === "string" ? data.logoUrl : null,
    ready: data.ready === true,
    stage3Score: typeof stageScores?.stage3 === "number" ? stageScores.stage3 : 0,
    totalScore: typeof data.totalScore === "number" ? data.totalScore : 0,
  };
}

export function useStage3Ranking(enabled = true) {
  const { docs, loading, error } = useTeamStatesSnapshot("main", enabled);

  const teams = useMemo(
    () =>
      getStage3Ranking(
        docs.map((item) => normalizeTeamState(item.id, item.data)),
      ),
    [docs],
  );

  return { teams, loading, error };
}
