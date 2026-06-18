"use client";

import { onSnapshot, query } from "firebase/firestore";
import { useEffect, useState } from "react";
import { answersCollectionRef } from "@/firebase/firestore";
import { resolveAnswerCorrectLabel } from "@/features/facilitator/resolve-answer-correct-label";

export interface AnswerLogRow {
  id: string;
  teamId: string;
  teamName: string;
  stage: string;
  field: string | null;
  questionId: string | null;
  questionText: string;
  answer: string;
  correctAnswer: string | null;
  isCorrect: boolean | null;
  pointsDelta: number | null;
  createdAtMs: number;
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

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function normalize(id: string, data: Record<string, unknown>): AnswerLogRow {
  const answerText = asString(data.answer) || asString(data.answerText) || asString(data.selectedAnswer);
  const stage = asString(data.stage) || "—";
  const questionId = asString(data.questionId) || null;
  const field = asString(data.field) || null;

  return {
    id,
    teamId: asString(data.teamId),
    teamName: asString(data.teamName) || "فريق",
    stage,
    field,
    questionId,
    questionText: asString(data.questionText) || questionId || "—",
    answer: answerText,
    correctAnswer: resolveAnswerCorrectLabel({ stage, questionId, field }),
    isCorrect: typeof data.isCorrect === "boolean" ? data.isCorrect : null,
    pointsDelta: typeof data.pointsDelta === "number" ? data.pointsDelta : null,
    createdAtMs: toMs(data.createdAt) || toMs(data.confirmedAt),
  };
}

export function useAnswersLog() {
  const [rows, setRows] = useState<AnswerLogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const answersQuery = query(answersCollectionRef("main"));
    return onSnapshot(
      answersQuery,
      (snapshot) => {
        const items = snapshot.docs.map((item) => normalize(item.id, item.data()));
        items.sort((first, second) => second.createdAtMs - first.createdAtMs);
        setRows(items);
        setError(null);
        setLoading(false);
      },
      () => {
        setError("تعذر تحميل سجل الإجابات.");
        setLoading(false);
      },
    );
  }, []);

  return { rows, loading, error };
}
