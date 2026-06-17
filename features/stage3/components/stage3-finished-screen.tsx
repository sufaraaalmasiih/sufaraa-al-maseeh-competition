"use client";

import { onAuthStateChanged } from "firebase/auth";
import { onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";
import { ErrorState, LoadingState } from "@/components/layout/state-view";
import { TeamStageFinishedScreen } from "@/components/competition/team-stage-finished-screen";
import { AudienceStage3FinishedAudience } from "@/features/audience/components/audience-stage3-finished";
import { Stage3RankingTable } from "@/features/stage3/components/stage3-ranking-table";
import { STAGE3_NAME } from "@/features/stage3/stage3-constants";
import { useStage3Ranking } from "@/features/stage3/use-stage3-ranking";
import { firebaseAuth } from "@/firebase/firebaseClient";
import { teamStateRef } from "@/firebase/firestore";

interface Stage3FinishedScreenProps {
  variant: "facilitator" | "audience" | "team";
}

function Stage3TeamFinishedScreen() {
  const [stage3Score, setStage3Score] = useState<number | null>(null);
  const [totalScore, setTotalScore] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribeTeamState: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(firebaseAuth, (user) => {
      unsubscribeTeamState?.();

      if (!user) {
        setStage3Score(null);
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
          setStage3Score(
            typeof data?.stageScores?.stage3 === "number" ? data.stageScores.stage3 : 0,
          );
          setTotalScore(typeof data?.totalScore === "number" ? data.totalScore : 0);
          setError(null);
          setLoading(false);
        },
        () => {
          setError("تعذر تحميل نتيجة المرحلة الثالثة.");
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
      badge={STAGE3_NAME}
      subtitle="لقد أنهيتم مرحلة على المحك"
      scores={[
        {
          label: "نتيجة المرحلة الثالثة",
          value: stage3Score ?? 0,
          hint: (stage3Score ?? 0) === 0 ? "لم تُسجل نقاط في هذه المرحلة بعد." : undefined,
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

export function Stage3FinishedScreen({ variant }: Stage3FinishedScreenProps) {
  const { teams, loading, error } = useStage3Ranking();

  if (variant === "team") {
    return <Stage3TeamFinishedScreen />;
  }

  if (variant === "audience") {
    return (
      <AudienceStage3FinishedAudience
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
          <p className="flow-stage-outro__kicker">{STAGE3_NAME}</p>
          <h2 className="flow-stage-outro__title">انتهت مرحلة على المحك</h2>
          <p className="flow-stage-outro__desc">
            ترتيب المرحلة الثالثة فقط — بدون النتائج النهائية للمسابقة.
          </p>
        </div>
      </div>
      <Stage3RankingTable
        teams={teams}
        loading={loading}
        error={error}
        variant={variant}
        title="ترتيب مرحلة على المحك"
      />
    </div>
  );
}
