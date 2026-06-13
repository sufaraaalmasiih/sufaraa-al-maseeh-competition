"use client";

import { onSnapshot, query } from "firebase/firestore";
import { useEffect, useState } from "react";
import { answersCollectionRef } from "@/firebase/firestore";

export interface AnswerLogRow {
  id: string;
  teamId: string;
  teamName: string;
  stage: string;
  field: string | null;
  questionText: string;
  answer: string;
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
  return {
    id,
    teamId: asString(data.teamId),
    teamName: asString(data.teamName) || "فريق",
    stage: asString(data.stage) || "—",
    field: asString(data.field) || null,
    questionText: asString(data.questionText) || asString(data.questionId) || "—",
    answer: asString(data.answer),
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
