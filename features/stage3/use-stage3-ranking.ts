"use client";

import { onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";
import { teamStatesCollectionRef } from "@/firebase/firestore";
import {
  getStage3Ranking,
  type RankedStage3Team,
  type Stage3RankingTeam,
} from "@/features/stage3/stage3-ranking";

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
    ready: data.ready === true,
    stage3Score: typeof stageScores?.stage3 === "number" ? stageScores.stage3 : 0,
    totalScore: typeof data.totalScore === "number" ? data.totalScore : 0,
  };
}

export function useStage3Ranking() {
  const [teams, setTeams] = useState<RankedStage3Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return onSnapshot(
      teamStatesCollectionRef("main"),
      (snapshot) => {
        setTeams(
          getStage3Ranking(
            snapshot.docs.map((item) => normalizeTeamState(item.id, item.data())),
          ),
        );
        setError(null);
        setLoading(false);
      },
      () => {
        setError("تعذر تحميل ترتيب المرحلة الثالثة.");
        setLoading(false);
      },
    );
  }, []);

  return { teams, loading, error };
}
