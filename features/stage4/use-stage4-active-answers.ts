"use client";

import { onSnapshot, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import { answersCollectionRef } from "@/firebase/firestore";

const MAIN_COMPETITION_ID = "main";

export interface Stage4ActiveAnswerRow {
  answerDocId: string;
  teamId: string;
  teamName: string;
  answerText: string;
  passed: boolean;
  confirmed: boolean;
  isCorrect: boolean;
  pointsDelta: number;
  streakBefore: number;
  streakAfter: number;
}

const ANSWERS_LOAD_TIMEOUT_MS = 4_000;

export function useStage4ActiveAnswers(questionId: string | null) {
  const [answers, setAnswers] = useState<Stage4ActiveAnswerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!questionId) {
      setAnswers([]);
      setLoading(false);
      setError(null);
      return;
    }

    let settled = false;
    const settleLoading = () => {
      if (settled) {
        return;
      }
      settled = true;
      setLoading(false);
    };

    setLoading(true);

    const timeoutId = window.setTimeout(settleLoading, ANSWERS_LOAD_TIMEOUT_MS);

    const answersQuery = query(
      answersCollectionRef(MAIN_COMPETITION_ID),
      where("stage", "==", "stage4"),
      where("questionId", "==", questionId),
    );

    const unsubscribe = onSnapshot(
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
                passed: data.passed === true,
                answerText:
                  typeof data.answerText === "string"
                    ? data.answerText
                    : typeof data.selectedAnswer === "string"
                      ? data.selectedAnswer
                      : "",
                confirmed: data.confirmed === true,
                isCorrect: data.isCorrect === true,
                pointsDelta: typeof data.pointsDelta === "number" ? data.pointsDelta : 0,
                streakBefore:
                  typeof data.streakBefore === "number" ? data.streakBefore : 0,
                streakAfter: typeof data.streakAfter === "number" ? data.streakAfter : 0,
              };
            })
            .sort((first, second) => first.teamName.localeCompare(second.teamName, "ar")),
        );
        setError(null);
        settleLoading();
      },
      () => {
        setError("تعذر تحميل إجابات المرحلة الرابعة.");
        settleLoading();
      },
    );

    return () => {
      window.clearTimeout(timeoutId);
      unsubscribe();
    };
  }, [questionId]);

  return { answers, loading, error };
}
