"use client";

import { onAuthStateChanged } from "firebase/auth";
import { onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { ErrorState, LoadingState } from "@/components/layout/state-view";
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
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState title="تعذر تحميل النتيجة" description={error} />;
  }

  return (
    <section className="competition-stage-screen competition-stage-screen--finished">
      <div className="competition-stage-screen__card glass-card-white">
        <span className="competition-stage-screen__badge">{STAGE2_NAME}</span>

        <div className="competition-stage-screen__finished-body">
          <div className="competition-stage-screen__finished-lead">
            <div aria-hidden className="competition-stage-screen__icon">
              <CheckCircle2 className="h-8 w-8" strokeWidth={2.4} />
            </div>
            <div className="competition-stage-screen__finished-copy">
              <h2 className="competition-stage-screen__title">أحسنتم!</h2>
              <p className="competition-stage-screen__subtitle">لقد أنهيتم مرحلة {STAGE2_NAME}</p>
            </div>
          </div>

          <div className="competition-stage-screen__finished-scores competition-stage-screen__finished-scores--dual">
            <div className="competition-stage-screen__score-card">
              <p className="competition-stage-screen__score-label">نتيجة المرحلة الثانية</p>
              <p className="competition-stage-screen__score-value">{stage2Score ?? 0}</p>
              {(stage2Score ?? 0) === 0 ? (
                <p className="mt-2 text-xs font-bold" style={{ color: "rgba(20,58,90,0.55)" }}>
                  يمكنكم التعويض لاحقاً
                </p>
              ) : null}
            </div>
            <div className="competition-stage-screen__score-card competition-stage-screen__score-card--muted">
              <p className="competition-stage-screen__score-label">المجموع الكلي</p>
              <p className="competition-stage-screen__score-value">{totalScore ?? 0}</p>
            </div>
          </div>
        </div>

        <div className="competition-stage-screen__wait">
          <span aria-hidden className="competition-stage-screen__wait-pulse" />
          <p className="competition-stage-screen__wait-title">بانتظار توجيه الميسر</p>
          <p className="competition-stage-screen__wait-hint">
            سيتم فتح المرحلة التالية عندما يوجّهكم الميسر.
          </p>
        </div>
      </div>
    </section>
  );
}
