"use client";

import { onAuthStateChanged } from "firebase/auth";
import { onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { ErrorState, LoadingState } from "@/components/layout/state-view";
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
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState title="تعذر تحميل النتيجة" description={error} />;
  }

  return (
    <section className="competition-stage-screen competition-stage-screen--finished">
      <div className="competition-stage-screen__card glass-card-white">
        <span className="competition-stage-screen__badge">اجمعوا الكنوز</span>

        <div className="competition-stage-screen__finished-body">
          <div className="competition-stage-screen__finished-lead">
            <div aria-hidden className="competition-stage-screen__icon">
              <CheckCircle2 className="h-8 w-8" strokeWidth={2.4} />
            </div>
            <div className="competition-stage-screen__finished-copy">
              <h2 className="competition-stage-screen__title">أحسنتم!</h2>
              <p className="competition-stage-screen__subtitle">لقد أنهيتم مرحلة اجمعوا الكنوز</p>
            </div>
          </div>

          <div className="competition-stage-screen__finished-scores">
            <div className="competition-stage-screen__score-card">
              <p className="competition-stage-screen__score-label">نتيجتكم في المرحلة الأولى</p>
              <p className="competition-stage-screen__score-value">{score ?? 0}</p>
              {(score ?? 0) === 0 ? (
                <p className="mt-2 text-xs font-bold sm:text-sm" style={{ color: "rgba(20,58,90,0.55)" }}>
                  لم تُسجل نقاط في هذه المرحلة بعد.
                </p>
              ) : null}
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
