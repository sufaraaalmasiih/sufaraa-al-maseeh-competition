"use client";

import { useMemo } from "react";
import {
  rankStage1Teams,
  type RankedStage1Team,
  type Stage1RankingTeam,
} from "@/features/stage1/stage1-ranking";
import { useTeamStatesSnapshot } from "@/features/gameflow/team-states-store";

function normalizeTeamState(
  id: string,
  data: Record<string, unknown>,
): Stage1RankingTeam {
  const stageScores = data.stageScores as Record<string, unknown> | undefined;
  const progress = data.progress as Record<string, unknown> | undefined;
  const readiness = data.readiness as Record<string, unknown> | undefined;

  return {
    teamId: typeof data.teamId === "string" ? data.teamId : id,
    teamName: typeof data.teamName === "string" ? data.teamName : "فريق بدون اسم",
    governorate:
      typeof data.governorate === "string" ? data.governorate : "غير محددة",
    logoUrl: typeof data.logoUrl === "string" ? data.logoUrl : null,
    ready: data.ready === true,
    competitionIntroReady: readiness?.competitionIntro === true,
    stage1IntroReady: readiness?.stage1Intro === true,
    stage2IntroReady: readiness?.stage2Intro === true,
    stage3IntroReady: readiness?.stage3Intro === true,
    stage4IntroReady: readiness?.stage4Intro === true,
    stage1Score: typeof stageScores?.stage1 === "number" ? stageScores.stage1 : 0,
    totalScore: typeof data.totalScore === "number" ? data.totalScore : 0,
    stage1QuestionIndex:
      typeof progress?.stage1QuestionIndex === "number"
        ? progress.stage1QuestionIndex
        : 0,
  };
}

export function useStage1Ranking() {
  const { docs, loading, error } = useTeamStatesSnapshot("main");

  const teams = useMemo(
    () =>
      rankStage1Teams(
        docs.map((item) => normalizeTeamState(item.id, item.data)),
      ),
    [docs],
  );

  return { teams, loading, error };
}
