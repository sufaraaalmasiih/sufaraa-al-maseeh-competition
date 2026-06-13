"use client";

import { onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";
import { teamStatesCollectionRef } from "@/firebase/firestore";
import {
  rankStage1Teams,
  type RankedStage1Team,
  type Stage1RankingTeam,
} from "@/features/stage1/stage1-ranking";

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
    ready: data.ready === true,
    competitionIntroReady: readiness?.competitionIntro === true,
    stage1IntroReady: readiness?.stage1Intro === true,
    stage1Score: typeof stageScores?.stage1 === "number" ? stageScores.stage1 : 0,
    totalScore: typeof data.totalScore === "number" ? data.totalScore : 0,
    stage1QuestionIndex:
      typeof progress?.stage1QuestionIndex === "number"
        ? progress.stage1QuestionIndex
        : 0,
  };
}

export function useStage1Ranking() {
  const [teams, setTeams] = useState<RankedStage1Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return onSnapshot(
      teamStatesCollectionRef("main"),
      (snapshot) => {
        setTeams(
          rankStage1Teams(
            snapshot.docs.map((item) => normalizeTeamState(item.id, item.data())),
          ),
        );
        setError(null);
        setLoading(false);
      },
      () => {
        setError("تعذر تحميل ترتيب المرحلة الأولى.");
        setLoading(false);
      },
    );
  }, []);

  return { teams, loading, error };
}
