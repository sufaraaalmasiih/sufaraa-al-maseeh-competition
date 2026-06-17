"use client";

import { onAuthStateChanged } from "firebase/auth";
import { onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";
import { firebaseAuth } from "@/firebase/firebaseClient";
import { teamStateRef } from "@/firebase/firestore";

function parseAnsweredQuestionIds(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string" && item.length > 0);
}

export function useTeamStage4Progress() {
  const [answeredQuestionIds, setAnsweredQuestionIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribeTeamState: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(firebaseAuth, (user) => {
      unsubscribeTeamState?.();

      if (!user) {
        setAnsweredQuestionIds([]);
        setLoading(false);
        setError("تعذر تحديد الفريق الحالي.");
        return;
      }

      setLoading(true);
      unsubscribeTeamState = onSnapshot(
        teamStateRef("main", user.uid),
        (snapshot) => {
          const progress = snapshot.data()?.progress as Record<string, unknown> | undefined;
          setAnsweredQuestionIds(
            parseAnsweredQuestionIds(progress?.stage4AnsweredQuestionIds),
          );
          setError(null);
          setLoading(false);
        },
        () => {
          setError("تعذر تحميل تقدم المرحلة الرابعة.");
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
    answeredQuestionIds,
    loading,
    error,
  };
}
