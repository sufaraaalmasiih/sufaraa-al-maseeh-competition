"use client";

import { onSnapshot, query, where } from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import { answersCollectionRef } from "@/firebase/firestore";
import { resolveAnswerCorrectLabel } from "@/features/facilitator/resolve-answer-correct-label";
import { getFacilitatorPhasePlan } from "@/features/facilitator/facilitator-flow-plan";
import { useTeamStatesSnapshot } from "@/features/gameflow/team-states-store";
import { useGameFlow } from "@/features/gameflow/use-game-flow";
import { useAuthRole } from "@/hooks/use-auth-role";

export interface CoachHistoryItem {
  id: string;
  questionText: string;
  answer: string;
  correctAnswer: string | null;
  isCorrect: boolean;
  pointsDelta: number;
  stage: string;
}

const STAGE_LABELS: Record<string, string> = {
  stage1: "المرحلة الأولى",
  stage2: "المرحلة الثانية",
  stage3: "المرحلة الثالثة",
  stage4: "المرحلة الرابعة",
};

const OUTCOME_LABELS: Record<string, string> = {
  selection_timeout: "انتهى وقت الاختيار",
  pass: "تمرير",
  no_answer: "بدون إجابة",
  wrong: "إجابة خاطئة",
  correct: "إجابة صحيحة",
};

function formatStageLabel(stage: string): string {
  return STAGE_LABELS[stage] ?? stage;
}

function formatQuestionLabel(data: Record<string, unknown>): string {
  if (typeof data.questionText === "string" && data.questionText.trim().length > 0) {
    const text = data.questionText.trim();
    if (!text.startsWith("stage") && !text.includes("selection_timeout")) {
      return text;
    }
  }

  const outcome = typeof data.outcome === "string" ? data.outcome : "";
  if (outcome && OUTCOME_LABELS[outcome]) {
    return OUTCOME_LABELS[outcome];
  }

  if (typeof data.field === "string" && data.field.length > 0) {
    return `سؤال ${data.field}`;
  }

  return "سؤال مسابقة";
}

function formatAnswerLabel(data: Record<string, unknown>): string {
  if (data.passed === true) {
    return "تمرير";
  }

  if (typeof data.outcome === "string" && OUTCOME_LABELS[data.outcome]) {
    return OUTCOME_LABELS[data.outcome];
  }

  const answer =
    (typeof data.answer === "string" ? data.answer.trim() : "") ||
    (typeof data.answerText === "string" ? data.answerText.trim() : "") ||
    (typeof data.selectedAnswer === "string" ? data.selectedAnswer.trim() : "");
  if (answer.length > 0) {
    return answer;
  }

  return "—";
}

function toMs(value: unknown): number {
  if (value && typeof value === "object" && "toMillis" in value) {
    try {
      return (value as { toMillis: () => number }).toMillis();
    } catch {
      return 0;
    }
  }
  return 0;
}

function stageScoreFromKey(
  stageKey: string,
  stageScores: Record<string, unknown> | undefined,
): number {
  if (!stageScores) return 0;
  if (stageKey === "stage1") return typeof stageScores.stage1 === "number" ? stageScores.stage1 : 0;
  if (stageKey === "stage2") return typeof stageScores.stage2 === "number" ? stageScores.stage2 : 0;
  if (stageKey === "stage3") return typeof stageScores.stage3 === "number" ? stageScores.stage3 : 0;
  if (stageKey === "stage4") return typeof stageScores.stage4 === "number" ? stageScores.stage4 : 0;
  return 0;
}

export function useCoachDashboard() {
  const { user } = useAuthRole();
  const teamId = user?.uid ?? null;
  const { status, loading: gameFlowLoading, error: gameFlowError } = useGameFlow();
  const { docs, loading: teamsLoading, error: teamsError } = useTeamStatesSnapshot("main", Boolean(teamId));
  const [history, setHistory] = useState<CoachHistoryItem[]>([]);
  const [allHistory, setAllHistory] = useState<CoachHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState<string | null>(null);

  const plan = status ? getFacilitatorPhasePlan(status) : null;
  const stageName = plan?.stageName ?? "—";
  const stageKey = plan?.stageKey ?? "pre";

  const teamSummary = useMemo(() => {
    if (!teamId) {
      return null;
    }

    const rows = docs.map((item) => ({
      id: item.id,
      data: item.data,
    }));

    const sorted = [...rows].sort((a, b) => {
      const aTotal = typeof a.data.totalScore === "number" ? a.data.totalScore : 0;
      const bTotal = typeof b.data.totalScore === "number" ? b.data.totalScore : 0;
      if (bTotal !== aTotal) return bTotal - aTotal;
      const aName = typeof a.data.teamName === "string" ? a.data.teamName : "";
      const bName = typeof b.data.teamName === "string" ? b.data.teamName : "";
      return aName.localeCompare(bName, "ar");
    });

    const myIndex = sorted.findIndex((row) => row.id === teamId);
    const myRow = myIndex >= 0 ? sorted[myIndex] : null;
    if (!myRow) {
      return null;
    }

    const stageScores = myRow.data.stageScores as Record<string, unknown> | undefined;

    return {
      teamName: typeof myRow.data.teamName === "string" ? myRow.data.teamName : "فريق",
      stageScore: stageScoreFromKey(stageKey, stageScores),
      totalScore: typeof myRow.data.totalScore === "number" ? myRow.data.totalScore : 0,
      rank: myIndex + 1,
      teamCount: sorted.length,
    };
  }, [docs, stageKey, teamId]);

  useEffect(() => {
    if (!teamId) {
      setHistory([]);
      setAllHistory([]);
      setHistoryLoading(false);
      return undefined;
    }

    setHistoryLoading(true);
    const answersQuery = query(
      answersCollectionRef("main"),
      where("teamId", "==", teamId),
    );

    return onSnapshot(
      answersQuery,
      (snapshot) => {
        const items = snapshot.docs
          .map((item) => {
            const data = item.data();
            if (typeof data.isCorrect !== "boolean") {
              return null;
            }
            const stage = typeof data.stage === "string" ? data.stage : "—";
            const questionId =
              typeof data.questionId === "string" ? data.questionId : null;
            const field = typeof data.field === "string" ? data.field : null;

            return {
              id: item.id,
              questionText: formatQuestionLabel(data),
              answer: formatAnswerLabel(data),
              correctAnswer: resolveAnswerCorrectLabel({ stage, questionId, field }),
              isCorrect: data.isCorrect,
              pointsDelta: typeof data.pointsDelta === "number" ? data.pointsDelta : 0,
              stage: formatStageLabel(stage),
              createdAtMs: toMs(data.createdAt) || toMs(data.confirmedAt),
            };
          })
          .filter((item): item is CoachHistoryItem & { createdAtMs: number } => item !== null)
          .sort((first, second) => second.createdAtMs - first.createdAtMs);

        const normalized = items.map(({ createdAtMs: _createdAtMs, ...row }) => row);

        setAllHistory(normalized);
        setHistory(normalized.slice(0, 5));
        setHistoryError(null);
        setHistoryLoading(false);
      },
      () => {
        setAllHistory([]);
        setHistoryError("تعذر تحميل تاريخ الأسئلة.");
        setHistoryLoading(false);
      },
    );
  }, [teamId]);

  return {
    teamId,
    status,
    stageName,
    teamSummary,
    history,
    allHistory,
    loading: gameFlowLoading || teamsLoading || historyLoading,
    error: gameFlowError ?? teamsError ?? historyError,
  };
}
