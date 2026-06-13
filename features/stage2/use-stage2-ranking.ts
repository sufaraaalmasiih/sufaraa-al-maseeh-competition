"use client";

import { onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";
import { teamStatesCollectionRef } from "@/firebase/firestore";
import {
  getStage2Ranking,
  type RankedStage2Team,
  type Stage2RankingTeam,
} from "@/features/stage2/stage2-ranking";

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
    ready: data.ready === true,
    stage2Score: typeof stageScores?.stage2 === "number" ? stageScores.stage2 : 0,
    totalScore: typeof data.totalScore === "number" ? data.totalScore : 0,
  };
}

export function useStage2Ranking() {
  const [teams, setTeams] = useState<RankedStage2Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return onSnapshot(
      teamStatesCollectionRef("main"),
      (snapshot) => {
        setTeams(
          getStage2Ranking(
            snapshot.docs.map((item) => normalizeTeamState(item.id, item.data())),
          ),
        );
        setError(null);
        setLoading(false);
      },
      () => {
        setError("تعذر تحميل ترتيب المرحلة الثانية.");
        setLoading(false);
      },
    );
  }, []);

  return { teams, loading, error };
}
