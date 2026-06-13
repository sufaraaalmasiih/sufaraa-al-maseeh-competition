"use client";

import { onAuthStateChanged } from "firebase/auth";
import { onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";
import { firebaseAuth } from "@/firebase/firebaseClient";
import { teamStateRef } from "@/firebase/firestore";
import { patchLoadingDebug } from "@/lib/loading-debug-store";
import { realLoadingDebug } from "@/lib/real-loading-debug";

export function useStage1TeamProgress() {
  const [questionIndex, setQuestionIndex] = useState(0);
  const [stage1Score, setStage1Score] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribeTeamState: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(firebaseAuth, (user) => {
      unsubscribeTeamState?.();

      if (!user) {
        setQuestionIndex(0);
        setStage1Score(0);
        setLoading(false);
        setError("تعذر تحديد الفريق الحالي.");
        patchLoadingDebug({ stage1ProgressLoading: false });
        realLoadingDebug("useStage1TeamProgress", "loading false reached (no user)");
        return;
      }

      const teamId = user.uid;
      const listenerPath = `competitions/main/teams/${teamId}`;
      setLoading(true);
      patchLoadingDebug({ stage1ProgressLoading: true });
      realLoadingDebug("useStage1TeamProgress", "subscribing team doc listener", {
        teamId,
        listenerPath,
      });

      unsubscribeTeamState = onSnapshot(
        teamStateRef("main", teamId),
        (snapshot) => {
          realLoadingDebug("useStage1TeamProgress", "team doc snapshot received", {
            teamId,
            listenerPath,
            snapshotReceived: true,
            exists: snapshot.exists(),
          });

          const data = snapshot.data();
          const progress = data?.progress as Record<string, unknown> | undefined;
          const stageScores = data?.stageScores as Record<string, unknown> | undefined;

          setQuestionIndex(
            typeof progress?.stage1QuestionIndex === "number"
              ? Math.max(0, progress.stage1QuestionIndex)
              : 0,
          );
          setStage1Score(
            typeof stageScores?.stage1 === "number" ? stageScores.stage1 : 0,
          );
          setError(null);
          setLoading(false);
          patchLoadingDebug({ stage1ProgressLoading: false });
          realLoadingDebug("useStage1TeamProgress", "loading false reached", {
            teamId,
            questionIndex:
              typeof progress?.stage1QuestionIndex === "number"
                ? progress.stage1QuestionIndex
                : 0,
          });
        },
        (listenerError) => {
          setError("تعذر تحميل تقدم المرحلة الأولى.");
          setLoading(false);
          patchLoadingDebug({ stage1ProgressLoading: false });
          realLoadingDebug("useStage1TeamProgress", "loading false reached (listener error)", {
            teamId,
            listenerPath,
            snapshotReceived: false,
            error: listenerError instanceof Error ? listenerError.message : String(listenerError),
          });
        },
      );
    });

    return () => {
      unsubscribeTeamState?.();
      unsubscribeAuth();
    };
  }, []);

  return { questionIndex, stage1Score, loading, error };
}
