"use client";

import { onAuthStateChanged } from "firebase/auth";
import { onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";
import { firebaseAuth } from "@/firebase/firebaseClient";
import { answerRef } from "@/firebase/firestore";
import { buildStage3AnswerId } from "@/features/stage3/stage3-answer-id";
import type { Stage3AnswerOutcome } from "@/features/stage3/stage3-scoring";

const MAIN_COMPETITION_ID = "main";

export interface Stage3MyAnswerState {
  confirmed: boolean;
  passed: boolean;
  answer: string;
  isCorrect: boolean;
  pointsDelta: number;
  isOwner: boolean;
  outcome?: Stage3AnswerOutcome;
}

export function useStage3MyAnswer(questionId: string | null) {
  const [teamId, setTeamId] = useState<string | null>(null);
  const [answerState, setAnswerState] = useState<Stage3MyAnswerState | null>(null);
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
        answerRef(MAIN_COMPETITION_ID, buildStage3AnswerId(questionId, user.uid)),
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
            answer: typeof data.answer === "string" ? data.answer : "",
            isCorrect: data.isCorrect === true,
            pointsDelta: typeof data.pointsDelta === "number" ? data.pointsDelta : 0,
            isOwner: data.isOwner === true,
            outcome:
              data.outcome === "correct" ||
              data.outcome === "wrong" ||
              data.outcome === "no_answer" ||
              data.outcome === "pass" ||
              data.outcome === "selection_timeout"
                ? data.outcome
                : undefined,
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
