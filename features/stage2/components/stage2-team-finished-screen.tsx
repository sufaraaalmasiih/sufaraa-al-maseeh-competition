"use client";

import { onAuthStateChanged } from "firebase/auth";
import { onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";
import { ErrorState, LoadingState } from "@/components/layout/state-view";
import { TeamStageFinishedScreen } from "@/components/competition/team-stage-finished-screen";
import { STAGE2_NAME } from "@/features/stage2/stage2-constants";
import { firebaseAuth } from "@/firebase/firebaseClient";
import { teamStateRef } from "@/firebase/firestore";

export function Stage2TeamFinishedScreen() {
  const [stage2Score, setStage2Score] = useState<number | null>(null);
  const [totalScore, setTotalScore] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribeTeamState: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(firebaseAuth, (user) => {
      unsubscribeTeamState?.();

      if (!user) {
        setStage2Score(null);
        setTotalScore(null);
        setLoading(false);
        setError("تعذر تحديد الفريق الحالي.");
        return;
      }

      setLoading(true);
      unsubscribeTeamState = onSnapshot(
        teamStateRef("main", user.uid),
        (snapshot) => {
          const data = snapshot.data();
          setStage2Score(
            typeof data?.stageScores?.stage2 === "number" ? data.stageScores.stage2 : 0,
          );
          setTotalScore(typeof data?.totalScore === "number" ? data.totalScore : 0);
          setError(null);
          setLoading(false);
        },
        () => {
          setError("تعذر تحميل نتيجة المرحلة الثانية.");
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
      badge={STAGE2_NAME}
      subtitle={`لقد أنهيتم مرحلة ${STAGE2_NAME}`}
      scores={[
        {
          label: "نتيجة المرحلة الثانية",
          value: stage2Score ?? 0,
          hint: (stage2Score ?? 0) === 0 ? "يمكنكم التعويض لاحقاً" : undefined,
        },
        {
          label: "المجموع الكلي",
          value: totalScore ?? 0,
          muted: true,
        },
      ]}
    />
  );
}
