"use client";

import { onAuthStateChanged } from "firebase/auth";
import { onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";
import { firebaseAuth } from "@/firebase/firebaseClient";
import { teamStateRef } from "@/firebase/firestore";

interface TeamStage3Context {
  teamId: string | null;
  teamName: string;
  stage3SelectedQuestionId: string;
  stage3CurrentField: string;
  stage3QuestionIndex: number;
  stage3Score: number;
  loading: boolean;
  error: string | null;
}

export function useTeamStage3Context(): TeamStage3Context {
  const [teamId, setTeamId] = useState<string | null>(null);
  const [teamName, setTeamName] = useState("—");
  const [stage3SelectedQuestionId, setStage3SelectedQuestionId] = useState("");
  const [stage3CurrentField, setStage3CurrentField] = useState("");
  const [stage3QuestionIndex, setStage3QuestionIndex] = useState(0);
  const [stage3Score, setStage3Score] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribeTeamState: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(firebaseAuth, (user) => {
      unsubscribeTeamState?.();

      if (!user) {
        setTeamId(null);
        setTeamName("—");
        setStage3SelectedQuestionId("");
        setStage3CurrentField("");
        setStage3QuestionIndex(0);
        setStage3Score(0);
        setLoading(false);
        setError(null);
        return;
      }

      setTeamId(user.uid);
      setLoading(true);
      setError(null);

      unsubscribeTeamState = onSnapshot(
        teamStateRef("main", user.uid),
        (snapshot) => {
          if (!snapshot.exists()) {
            setTeamName("—");
            setStage3SelectedQuestionId("");
            setStage3CurrentField("");
            setStage3QuestionIndex(0);
            setStage3Score(0);
            setError("لم يتم العثور على حالة الفريق.");
            setLoading(false);
            return;
          }

          const data = snapshot.data();
          const progress = data.progress as Record<string, unknown> | undefined;
          const stage3Progress = progress?.stage3 as Record<string, unknown> | undefined;
          const stageScores = data.stageScores as Record<string, unknown> | undefined;

          setTeamName(typeof data.teamName === "string" ? data.teamName : "—");
          setStage3SelectedQuestionId(
            typeof progress?.stage3SelectedQuestionId === "string"
              ? progress.stage3SelectedQuestionId
              : "",
          );
          setStage3CurrentField(
            typeof stage3Progress?.currentField === "string"
              ? stage3Progress.currentField
              : "",
          );
          setStage3QuestionIndex(
            typeof stage3Progress?.questionIndex === "number"
              ? stage3Progress.questionIndex
              : 0,
          );
          setStage3Score(typeof stageScores?.stage3 === "number" ? stageScores.stage3 : 0);
          setError(null);
          setLoading(false);
        },
        () => {
          setError("تعذر تحميل حالة الفريق.");
          setLoading(false);
        },
      );
    });

    return () => {
      unsubscribeTeamState?.();
      unsubscribeAuth();
    };
  }, []);

  return {
    teamId,
    teamName,
    stage3SelectedQuestionId,
    stage3CurrentField,
    stage3QuestionIndex,
    stage3Score,
    loading,
    error,
  };
}
