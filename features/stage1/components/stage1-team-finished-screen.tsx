"use client";

import { onAuthStateChanged } from "firebase/auth";
import { onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";
import { ErrorState, LoadingState } from "@/components/layout/state-view";
import { TeamStageFinishedScreen } from "@/components/competition/team-stage-finished-screen";
import { firebaseAuth } from "@/firebase/firebaseClient";
import { teamStateRef } from "@/firebase/firestore";

export function Stage1TeamFinishedScreen() {
  const [score, setScore] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribeTeamState: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(firebaseAuth, (user) => {
      unsubscribeTeamState?.();

      if (!user) {
        setScore(null);
        setLoading(false);
        setError("تعذر تحديد الفريق الحالي.");
        return;
      }

      setLoading(true);
      unsubscribeTeamState = onSnapshot(
        teamStateRef("main", user.uid),
        (snapshot) => {
          const data = snapshot.data();
          setScore(
            typeof data?.stageScores?.stage1 === "number" ? data.stageScores.stage1 : 0,
          );
          setError(null);
          setLoading(false);
        },
        () => {
          setError("تعذر تحميل نتيجة المرحلة الأولى.");
          setLoading(false);
        },
      );
    });

    return () => {
      unsubscribeTeamState?.();
      unsubscribeAuth();
    };
  }, []);

  if (loading) {
    return <LoadingState variant="page" />;
  }

  if (error) {
    return <ErrorState title="تعذر تحميل النتيجة" description={error} />;
  }

  return (
    <TeamStageFinishedScreen
      badge="اجمعوا الكنوز"
      subtitle="لقد أنهيتم مرحلة اجمعوا الكنوز"
      scores={[
        {
          label: "نتيجتكم في المرحلة الأولى",
          value: score ?? 0,
          hint:
            (score ?? 0) === 0 ? "لم تُسجل نقاط في هذه المرحلة بعد." : undefined,
        },
      ]}
    />
  );
}
