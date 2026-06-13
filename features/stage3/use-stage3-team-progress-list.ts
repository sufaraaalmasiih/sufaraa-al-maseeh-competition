"use client";

import { onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";
import { teamStatesCollectionRef } from "@/firebase/firestore";

export interface Stage3TeamProgressRow {
  teamId: string;
  teamName: string;
  stage3SelectedQuestionId: string;
  stage3CurrentField: string;
  stage3QuestionIndex: number;
  stage3Score: number;
  totalScore: number;
}

function normalizeTeamProgressRow(
  id: string,
  data: Record<string, unknown>,
): Stage3TeamProgressRow {
  const progress = data.progress as Record<string, unknown> | undefined;
  const stage3Progress = progress?.stage3 as Record<string, unknown> | undefined;
  const stageScores = data.stageScores as Record<string, unknown> | undefined;

  return {
    teamId: typeof data.teamId === "string" ? data.teamId : id,
    teamName: typeof data.teamName === "string" ? data.teamName : "فريق بدون اسم",
    stage3SelectedQuestionId:
      typeof progress?.stage3SelectedQuestionId === "string" &&
      progress.stage3SelectedQuestionId.length > 0
        ? progress.stage3SelectedQuestionId
        : "—",
    stage3CurrentField:
      typeof stage3Progress?.currentField === "string" &&
      stage3Progress.currentField.length > 0
        ? stage3Progress.currentField
        : "—",
    stage3QuestionIndex:
      typeof stage3Progress?.questionIndex === "number"
        ? stage3Progress.questionIndex
        : 0,
    stage3Score: typeof stageScores?.stage3 === "number" ? stageScores.stage3 : 0,
    totalScore: typeof data.totalScore === "number" ? data.totalScore : 0,
  };
}

export function useStage3TeamProgressList() {
  const [teams, setTeams] = useState<Stage3TeamProgressRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return onSnapshot(
      teamStatesCollectionRef("main"),
      (snapshot) => {
        setTeams(
          snapshot.docs
            .map((item) => normalizeTeamProgressRow(item.id, item.data()))
            .sort((first, second) =>
              first.teamName.localeCompare(second.teamName, "ar"),
            ),
        );
        setError(null);
        setLoading(false);
      },
      () => {
        setError("تعذر تحميل تقدم فرق المرحلة الثالثة.");
        setLoading(false);
      },
    );
  }, []);

  return { teams, loading, error };
}
