"use client";

import { onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";
import { teamStatesCollectionRef } from "@/firebase/firestore";
import {
  getStage2FieldByIndex,
  STAGE2_FIELD_COUNT,
} from "@/features/stage2/stage2-field-sequence";
import { normalizeStage2Progress } from "@/features/stage2/stage2-progress";
import {
  emptyStage2Roles,
  type Stage2RoleKey,
  type Stage2Roles,
} from "@/features/stage2/stage2-types";

export interface Stage2TeamProgressRow {
  teamId: string;
  teamName: string;
  currentFieldLabel: string;
  fieldOrder: number | null;
  fieldIndex: number;
  assignedPlayerName: string;
  isComplete: boolean;
  stage2Score: number;
  totalScore: number;
  stage2QuestionIndex: number;
}

function normalizeRoles(data: Record<string, unknown> | undefined): Stage2Roles {
  return {
    ...emptyStage2Roles,
    ...(data as Stage2Roles | undefined),
  };
}

function normalizeTeamProgressRow(
  id: string,
  data: Record<string, unknown>,
): Stage2TeamProgressRow {
  const progress = normalizeStage2Progress(
    data.progress as Record<string, unknown> | undefined,
  );
  const roles = normalizeRoles(data.stage2Roles as Record<string, unknown> | undefined);
  const stageScores = data.stageScores as Record<string, unknown> | undefined;
  const currentField = progress.isComplete
    ? null
    : getStage2FieldByIndex(progress.stage2FieldIndex);
  const assignedPlayerName =
    currentField && roles[currentField.key as Stage2RoleKey]
      ? roles[currentField.key as Stage2RoleKey]
      : "—";

  return {
    teamId: typeof data.teamId === "string" ? data.teamId : id,
    teamName: typeof data.teamName === "string" ? data.teamName : "فريق بدون اسم",
    currentFieldLabel: progress.isComplete
      ? "اكتملت جميع المجالات"
      : (currentField?.label ?? "—"),
    fieldOrder: progress.isComplete ? STAGE2_FIELD_COUNT : (currentField?.order ?? null),
    fieldIndex: progress.stage2FieldIndex,
    assignedPlayerName,
    isComplete: progress.isComplete,
    stage2Score: typeof stageScores?.stage2 === "number" ? stageScores.stage2 : 0,
    totalScore: typeof data.totalScore === "number" ? data.totalScore : 0,
    stage2QuestionIndex: progress.stage2QuestionIndex,
  };
}

export function useStage2TeamProgressList() {
  const [teams, setTeams] = useState<Stage2TeamProgressRow[]>([]);
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
        setError("تعذر تحميل تقدم فرق المرحلة الثانية.");
        setLoading(false);
      },
    );
  }, []);

  return { teams, loading, error };
}
