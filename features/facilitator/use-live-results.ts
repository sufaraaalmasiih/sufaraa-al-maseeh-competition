"use client";

import { useMemo } from "react";
import {
  getFacilitatorPhasePlan,
  type FacilitatorStageKey,
} from "@/features/facilitator/facilitator-flow-plan";
import { getStage2FieldByIndex } from "@/features/stage2/stage2-field-sequence";
import { normalizeStage2Progress } from "@/features/stage2/stage2-progress";
import {
  assignCompetitionRanks,
  compareFinishSpeed,
} from "@/lib/competition-rank-assignment";
import { useTeamStatesSnapshot } from "@/features/gameflow/team-states-store";
import type { GameFlowStatus } from "@/types";

export interface LiveResultRow {
  teamId: string;
  teamName: string;
  questionLabel: string;
  stageScore: number;
  totalScore: number;
  finishedAtMs: number | null;
}

interface LiveResultsContext {
  stage4QuestionIndex: number;
  stage4QuestionCount: number;
  stage3OwnerTeamId: string | null;
}

function num(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function stageScoreForKey(
  stageKey: FacilitatorStageKey,
  stageScores: Record<string, unknown> | undefined,
): number {
  if (stageKey === "stage1") {
    return num(stageScores?.stage1);
  }
  if (stageKey === "stage2") {
    return num(stageScores?.stage2);
  }
  if (stageKey === "stage3") {
    return num(stageScores?.stage3);
  }
  if (stageKey === "stage4") {
    return num(stageScores?.stage4);
  }
  if (stageKey === "final") {
    return num(stageScores?.stage1) + num(stageScores?.stage2) + num(stageScores?.stage3) + num(stageScores?.stage4);
  }
  return 0;
}

function buildQuestionLabel(
  stageKey: FacilitatorStageKey,
  id: string,
  data: Record<string, unknown>,
  context: LiveResultsContext,
): string {
  const progress = data.progress as Record<string, unknown> | undefined;
  const teamId = typeof data.teamId === "string" ? data.teamId : id;

  if (stageKey === "pre") {
    return "—";
  }

  if (stageKey === "stage1") {
    const idx = num(progress?.stage1QuestionIndex);
    return idx > 0 ? `سؤال ${idx}` : "بداية";
  }

  if (stageKey === "stage2") {
    const stage2Progress = normalizeStage2Progress(progress);
    if (stage2Progress.isComplete) {
      return "اكتملت المجالات";
    }
    const field = getStage2FieldByIndex(stage2Progress.stage2FieldIndex);
    const questionPart =
      stage2Progress.stage2QuestionIndex > 0
        ? ` — سؤال ${stage2Progress.stage2QuestionIndex + 1}`
        : "";
    return field ? `${field.label}${questionPart}` : `مجال ${stage2Progress.stage2FieldIndex + 1}`;
  }

  if (stageKey === "stage3") {
    const selectedId = progress?.stage3SelectedQuestionId;
    if (typeof selectedId === "string" && selectedId.length > 0) {
      return selectedId;
    }
    if (context.stage3OwnerTeamId === teamId) {
      return "صاحب الدور";
    }
    return "—";
  }

  if (stageKey === "stage4") {
    const current = Math.min(context.stage4QuestionIndex + 1, context.stage4QuestionCount);
    return `سؤال ${current} / ${context.stage4QuestionCount}`;
  }

  return "—";
}

function finishedAtForStage(
  stageKey: FacilitatorStageKey,
  progress: Record<string, unknown> | undefined,
): number | null {
  if (!progress) {
    return null;
  }
  const key =
    stageKey === "stage1"
      ? "stage1FinishedAtMs"
      : stageKey === "stage2"
        ? "stage2FinishedAtMs"
        : stageKey === "stage3"
          ? "stage3FinishedAtMs"
          : stageKey === "stage4"
            ? "stage4FinishedAtMs"
            : null;
  if (key === null) {
    const stamps = [
      progress.stage1FinishedAtMs,
      progress.stage2FinishedAtMs,
      progress.stage3FinishedAtMs,
      progress.stage4FinishedAtMs,
    ].filter((value): value is number => typeof value === "number" && Number.isFinite(value));
    return stamps.length > 0 ? Math.max(...stamps) : null;
  }
  const value = progress[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function normalizeRow(
  id: string,
  data: Record<string, unknown>,
  stageKey: FacilitatorStageKey,
  context: LiveResultsContext,
): LiveResultRow {
  const stageScores = data.stageScores as Record<string, unknown> | undefined;
  const progress = data.progress as Record<string, unknown> | undefined;
  const storedTotal = num(data.totalScore);
  const summedTotal =
    num(stageScores?.stage1) +
    num(stageScores?.stage2) +
    num(stageScores?.stage3) +
    num(stageScores?.stage4);

  return {
    teamId: typeof data.teamId === "string" ? data.teamId : id,
    teamName: typeof data.teamName === "string" ? data.teamName : "فريق بدون اسم",
    questionLabel: buildQuestionLabel(stageKey, id, data, context),
    stageScore: stageScoreForKey(stageKey, stageScores),
    totalScore: storedTotal || summedTotal,
    finishedAtMs: finishedAtForStage(stageKey, progress),
  };
}

export function useLiveResults(
  status: GameFlowStatus | null,
  context: LiveResultsContext,
) {
  const enabled = Boolean(status);
  const { docs, loading, error } = useTeamStatesSnapshot("main", enabled);

  const plan = status ? getFacilitatorPhasePlan(status) : null;
  const stageName = plan?.stageName ?? "—";
  const stageKey = status ? getFacilitatorPhasePlan(status).stageKey : "pre";

  const rows = useMemo(() => {
    if (!enabled) {
      return [];
    }

    const nextRows = docs.map((item) =>
      normalizeRow(item.id, item.data, stageKey, context),
    );
    nextRows.sort((first, second) => {
      if (second.totalScore !== first.totalScore) {
        return second.totalScore - first.totalScore;
      }

      const bySpeed = compareFinishSpeed(first.finishedAtMs, second.finishedAtMs);
      if (bySpeed !== 0) {
        return bySpeed;
      }

      return first.teamName.localeCompare(second.teamName, "ar");
    });
    return nextRows;
  }, [context, docs, enabled, stageKey]);

  const teams = useMemo(
    () => assignCompetitionRanks(rows, (row) => row.totalScore),
    [rows],
  );

  return { teams, stageName, loading: enabled ? loading : false, error };
}
