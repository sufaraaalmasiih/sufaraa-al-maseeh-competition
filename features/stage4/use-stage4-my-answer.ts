"use client";

import { onAuthStateChanged } from "firebase/auth";
import { onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";
import { firebaseAuth } from "@/firebase/firebaseClient";
import { answerRef } from "@/firebase/firestore";
import { buildStage4AnswerId } from "@/features/stage4/stage4-answer-id";

const MAIN_COMPETITION_ID = "main";

export interface Stage4MyAnswerState {
  confirmed: boolean;
  passed: boolean;
  answerText: string;
  isCorrect: boolean;
  pointsDelta: number;
  streakAfter: number;
}

export function useStage4MyAnswer(questionId: string | null) {
  const [teamId, setTeamId] = useState<string | null>(null);
  const [answerState, setAnswerState] = useState<Stage4MyAnswerState | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeAnswer: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(firebaseAuth, (user) => {
      unsubscribeAnswer?.();
      setTeamId(user?.uid ?? null);

      if (!user || !questionId) {
        setAnswerState(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      unsubscribeAnswer = onSnapshot(
        answerRef(MAIN_COMPETITION_ID, buildStage4AnswerId(questionId, user.uid)),
        (snapshot) => {
          if (!snapshot.exists()) {
            setAnswerState(null);
            setLoading(false);
            return;
          }

          const data = snapshot.data();
          setAnswerState({
            confirmed: data.confirmed === true,
            passed: data.passed === true,
            answerText:
              typeof data.answerText === "string"
                ? data.answerText
                : typeof data.selectedAnswer === "string"
                  ? data.selectedAnswer
                  : "",
            isCorrect: data.isCorrect === true,
            pointsDelta: typeof data.pointsDelta === "number" ? data.pointsDelta : 0,
            streakAfter: typeof data.streakAfter === "number" ? data.streakAfter : 0,
          });
          setLoading(false);
        },
        () => {
          setAnswerState(null);
          setLoading(false);
        },
      );
    });

    return () => {
      unsubscribeAnswer?.();
      unsubscribeAuth();
    };
  }, [questionId]);

  return { teamId, answerState, loading };
}
