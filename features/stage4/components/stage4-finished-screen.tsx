"use client";

import { onAuthStateChanged } from "firebase/auth";
import { onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";
import { ErrorState, LoadingState } from "@/components/layout/state-view";
import { TeamStageFinishedScreen } from "@/components/competition/team-stage-finished-screen";
import { AudienceStage4FinishedAudience } from "@/features/audience/components/audience-stage4-finished";
import { Stage4RankingTable } from "@/features/stage4/components/stage4-ranking-table";
import { STAGE4_NAME } from "@/features/stage4/stage4-constants";
import { useStage4Ranking } from "@/features/stage4/use-stage4-ranking";
import { firebaseAuth } from "@/firebase/firebaseClient";
import { teamStateRef } from "@/firebase/firestore";

interface Stage4FinishedScreenProps {
  variant?: "team" | "facilitator" | "audience";
}

function Stage4TeamFinishedScreen() {
  const [stage4Score, setStage4Score] = useState<number | null>(null);
  const [totalScore, setTotalScore] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribeTeamState: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(firebaseAuth, (user) => {
      unsubscribeTeamState?.();

      if (!user) {
        setStage4Score(null);
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
          setStage4Score(
            typeof data?.stageScores?.stage4 === "number" ? data.stageScores.stage4 : 0,
          );
          setTotalScore(typeof data?.totalScore === "number" ? data.totalScore : 0);
          setError(null);
          setLoading(false);
        },
        () => {
          setError("تعذر تحميل نتيجة المرحلة الرابعة.");
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
      badge={STAGE4_NAME}
      badgeTone="blue"
      subtitle="لقد أنهيتم المرحلة الرابعة"
      scores={[
        {
          label: "نتيجة المرحلة الرابعة",
          value: stage4Score ?? 0,
          hint: (stage4Score ?? 0) === 0 ? "لم تُسجل نقاط في هذه المرحلة بعد." : undefined,
        },
        {
          label: "المجموع الكلي",
          value: totalScore ?? 0,
          muted: true,
        },
      ]}
      waitTitle="بانتظار النتائج النهائية"
      waitHint="سيعلن الميسر النتائج النهائية قريباً."
    />
  );
}

export function Stage4FinishedScreen({ variant = "team" }: Stage4FinishedScreenProps) {
  const { teams, loading, error } = useStage4Ranking();

  if (variant === "team") {
    return <Stage4TeamFinishedScreen />;
  }

  if (variant === "audience") {
    return (
      <AudienceStage4FinishedAudience
        teams={teams}
        loading={loading}
        error={error}
      />
    );
  }

  return (
    <div className="flow-workspace-panel space-y-4">
      <div className="flow-stage-outro">
        <div className="flow-stage-outro__inner">
          <p className="flow-stage-outro__kicker">{STAGE4_NAME}</p>
          <h2 className="flow-stage-outro__title">انتهت المرحلة الرابعة</h2>
          <p className="flow-stage-outro__desc">نتائج المرحلة الرابعة — استعد للنتائج النهائية.</p>
        </div>
      </div>
      <Stage4RankingTable teams={teams} loading={loading} error={error} variant={variant} />
    </div>
  );
}
