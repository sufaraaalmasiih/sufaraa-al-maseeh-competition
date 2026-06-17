"use client";

import { onAuthStateChanged } from "firebase/auth";
import { onSnapshot } from "firebase/firestore";
import { useEffect, useRef, useState } from "react";
import { getClientFirebaseAuth, ensureAuthPersistence } from "@/firebase/firebaseClient";
import { teamStateRef } from "@/firebase/firestore";
import {
  FIRESTORE_LISTENER_TIMEOUT_MS,
  scheduleFirestoreListenerTimeout,
} from "@/lib/firestore-listener-timeout";

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
  const subscribedTeamIdRef = useRef<string | null>(null);
  const loadingRef = useRef(true);

  useEffect(() => {
    loadingRef.current = loading;
  }, [loading]);

  useEffect(() => {
    let alive = true;
    let unsubscribeTeamState: (() => void) | undefined;
    let clearListenerTimeout: (() => void) | undefined;

    const finishLoading = (nextError: string | null = null) => {
      clearListenerTimeout?.();
      clearListenerTimeout = undefined;
      if (!alive) {
        return;
      }
      loadingRef.current = false;
      setLoading(false);
      if (nextError) {
        setError(nextError);
      }
    };

    void ensureAuthPersistence();

    const unsubscribeAuth = onAuthStateChanged(getClientFirebaseAuth(), (user) => {
      if (!alive) {
        return;
      }

      clearListenerTimeout?.();
      unsubscribeTeamState?.();
      unsubscribeTeamState = undefined;

      if (!user) {
        subscribedTeamIdRef.current = null;
        setTeamId(null);
        setTeamName("—");
        setStage3SelectedQuestionId("");
        setStage3CurrentField("");
        setStage3QuestionIndex(0);
        setStage3Score(0);
        setError(null);
        finishLoading();
        return;
      }

      const nextTeamId = user.uid;
      if (subscribedTeamIdRef.current === nextTeamId && unsubscribeTeamState) {
        return;
      }

      subscribedTeamIdRef.current = nextTeamId;
      setTeamId(nextTeamId);
      setError(null);
      loadingRef.current = true;
      setLoading(true);

      clearListenerTimeout = scheduleFirestoreListenerTimeout(
        () => loadingRef.current,
        () => {
          finishLoading("تعذر تحميل حالة الفريق خلال المهلة. أعد تحميل الصفحة.");
        },
        FIRESTORE_LISTENER_TIMEOUT_MS,
      );

      unsubscribeTeamState = onSnapshot(
        teamStateRef("main", nextTeamId),
        (snapshot) => {
          if (!alive) {
            return;
          }

          if (!snapshot.exists()) {
            setTeamName("—");
            setStage3SelectedQuestionId("");
            setStage3CurrentField("");
            setStage3QuestionIndex(0);
            setStage3Score(0);
            finishLoading("لم يتم العثور على حالة الفريق.");
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
            typeof stage3Progress?.currentField === "string" ? stage3Progress.currentField : "",
          );
          setStage3QuestionIndex(
            typeof stage3Progress?.questionIndex === "number" ? stage3Progress.questionIndex : 0,
          );
          setStage3Score(typeof stageScores?.stage3 === "number" ? stageScores.stage3 : 0);
          setError(null);
          finishLoading();
        },
        () => {
          finishLoading("تعذر تحميل حالة الفريق.");
        },
      );
    });

    return () => {
      alive = false;
      clearListenerTimeout?.();
      unsubscribeTeamState?.();
      unsubscribeAuth();
      subscribedTeamIdRef.current = null;
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
