"use client";

import { onSnapshot, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import { answersCollectionRef } from "@/firebase/firestore";
import type { Stage3AnswerOutcome } from "@/features/stage3/stage3-scoring";

const MAIN_COMPETITION_ID = "main";

export interface Stage3ActiveAnswerRow {
  answerDocId: string;
  teamId: string;
  teamName: string;
  isOwner: boolean;
  answer: string;
  passed: boolean;
  confirmed: boolean;
  isCorrect: boolean;
  outcome?: Stage3AnswerOutcome;
  pointsDelta: number;
}

export function useStage3ActiveAnswers(questionId: string | null) {
  const [answers, setAnswers] = useState<Stage3ActiveAnswerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!questionId) {
      setAnswers([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);

    const answersQuery = query(
      answersCollectionRef(MAIN_COMPETITION_ID),
      where("stage", "==", "stage3"),
      where("questionId", "==", questionId),
    );

    return onSnapshot(
      answersQuery,
      (snapshot) => {
        setAnswers(
          snapshot.docs
            .map((item) => {
              const data = item.data();

              return {
                answerDocId: item.id,
                teamId: typeof data.teamId === "string" ? data.teamId : "",
                teamName:
                  typeof data.teamName === "string" ? data.teamName : "فريق بدون اسم",
                isOwner: data.isOwner === true,
                passed: data.passed === true,
                answer: typeof data.answer === "string" ? data.answer : "",
                confirmed: data.confirmed === true,
                isCorrect: data.isCorrect === true,
                outcome:
                  data.outcome === "correct" ||
                  data.outcome === "wrong" ||
                  data.outcome === "no_answer" ||
                  data.outcome === "pass" ||
                  data.outcome === "selection_timeout"
                    ? data.outcome
                    : undefined,
                pointsDelta: typeof data.pointsDelta === "number" ? data.pointsDelta : 0,
              };
            })
            .sort((first, second) => first.teamName.localeCompare(second.teamName, "ar")),
        );
        setError(null);
        setLoading(false);
      },
      () => {
        setError("تعذر تحميل إجابات السؤال النشط.");
        setLoading(false);
      },
    );
  }, [questionId]);

  return { answers, loading, error };
}
