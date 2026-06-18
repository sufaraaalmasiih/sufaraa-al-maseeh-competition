"use client";

import { useEffect, useRef, useState } from "react";
import { Download } from "lucide-react";
import { CompetitionBrandHeaderCard } from "@/components/competition/competition-brand-header-card";
import { CompetitionFrozenBanner } from "@/components/layout/competition-frozen-banner";
import { CompetitionGradientShell } from "@/components/layout/competition-gradient-shell";
import { ErrorState, LoadingState } from "@/components/layout/state-view";
import { exportAnswersExcel } from "@/features/facilitator/export-answers-excel";
import { exportElementAsPng } from "@/features/facilitator/export-results-image";
import { useCoachDashboard } from "@/features/coach/use-coach-dashboard";
import { useGameFlow } from "@/features/gameflow/use-game-flow";
import { TeamArchivePanel } from "@/features/facilitator/components/team-archive-panel";
import { firebaseAuth } from "@/firebase/firebaseClient";
import { setCoachViewMode } from "@/lib/coach-view-mode";

export function CoachShell() {
  const { competitionFrozen } = useGameFlow();
  const { stageName, teamSummary, history, allHistory, loading, error } = useCoachDashboard();
  const historyListRef = useRef<HTMLUListElement | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    setCoachViewMode("coach");
  }, []);

  async function handleExportExcel() {
    if (allHistory.length === 0 || exporting) {
      return;
    }
    setExporting(true);
    try {
      await exportAnswersExcel({
        teamName: teamSummary?.teamName ?? "team",
        rows: allHistory.map((item) => ({
          time: "—",
          stage: item.stage,
          question: item.questionText,
          answer: item.answer || "—",
          correctAnswer: item.correctAnswer || "—",
          result: item.isCorrect ? "صحيح" : "خطأ",
          pointsDelta: item.pointsDelta,
        })),
        filePrefix: "coach-answers",
      });
    } finally {
      setExporting(false);
    }
  }

  async function handleExportImage() {
    if (!historyListRef.current || history.length === 0 || exporting) {
      return;
    }
    setExporting(true);
    try {
      await exportElementAsPng(
        historyListRef.current,
        `coach-answers-${teamSummary?.teamName ?? "team"}.png`,
      );
    } finally {
      setExporting(false);
    }
  }

  if (loading) {
    return (
      <CompetitionGradientShell
        centerContent
        className="coach-shell coach-shell--loading app-viewport-fill"
        contentClassName="app-auth-loading-screen"
      >
        <LoadingState variant="page" title="جاري تحميل لوحة المدرب..." />
      </CompetitionGradientShell>
    );
  }

  if (error) {
    return (
      <CompetitionGradientShell
        centerContent
        className="coach-shell coach-shell--loading app-viewport-fill"
        contentClassName="app-auth-loading-screen"
      >
        <ErrorState
          title="تعذر تحميل لوحة المدرب"
          description={error}
          actionHref="/team-login"
          actionLabel="إعادة تسجيل الدخول"
        />
      </CompetitionGradientShell>
    );
  }

  return (
    <CompetitionGradientShell scrollable className="coach-shell" contentClassName="coach-shell__content">
      <CompetitionFrozenBanner frozen={competitionFrozen} />

      <div className="coach-shell__header">
        <CompetitionBrandHeaderCard centerLabel="لوحة المدرب" />
        <p className="coach-shell__team-name">{teamSummary?.teamName ?? "فريق"}</p>
      </div>

      <section className="coach-card">
        <p className="coach-card__label">المرحلة الحالية</p>
        <p className="coach-card__value">{stageName}</p>
      </section>

      <section className="coach-stats">
        <article className="coach-stat">
          <p className="coach-stat__label">نقاط المرحلة</p>
          <p className="coach-stat__value">{teamSummary?.stageScore ?? 0}</p>
        </article>
        <article className="coach-stat">
          <p className="coach-stat__label">المجموع</p>
          <p className="coach-stat__value">{teamSummary?.totalScore ?? 0}</p>
        </article>
        <article className="coach-stat">
          <p className="coach-stat__label">الترتيب</p>
          <p className="coach-stat__value">
            {teamSummary ? `${teamSummary.rank} / ${teamSummary.teamCount}` : "—"}
          </p>
        </article>
      </section>

      <section className="coach-history">
        <h2 className="coach-history__title">آخر الأسئلة المعلنة</h2>
        <div className="facilitator-timer__buttons">
          <button
            type="button"
            className="facilitator-btn facilitator-btn--outline"
            disabled={allHistory.length === 0 || exporting}
            onClick={() => void handleExportExcel()}
          >
            <Download className="h-4 w-4" aria-hidden />
            {exporting ? "جارٍ التصدير..." : "تنزيل Excel"}
          </button>
          <button
            type="button"
            className="facilitator-btn facilitator-btn--outline"
            disabled={history.length === 0 || exporting}
            onClick={() => void handleExportImage()}
          >
            <Download className="h-4 w-4" aria-hidden />
            {exporting ? "جارٍ التصدير..." : "تنزيل صورة"}
          </button>
        </div>
        {history.length === 0 ? (
          <p className="coach-history__empty">لا توجد أسئلة مُعلنة بعد لفرقك.</p>
        ) : (
          <ul ref={historyListRef} className="coach-history__list">
            {history.map((item, index) => (
              <li
                key={item.id}
                className={
                  index === 0
                    ? "coach-history__item coach-history__item--latest"
                    : "coach-history__item coach-history__item--past"
                }
              >
                <div className="coach-history__item-head">
                  <span className="coach-history__stage">{item.stage}</span>
                  {index === 0 ? <span className="coach-history__badge">الأحدث</span> : null}
                </div>
                <p className="coach-history__question">{item.questionText}</p>
                <p className="coach-history__answer">إجابتكم: {item.answer || "—"}</p>
                {item.correctAnswer ? (
                  <p className="coach-history__correct">الإجابة الصحيحة: {item.correctAnswer}</p>
                ) : null}
                <p
                  className={
                    item.isCorrect
                      ? "coach-history__result coach-history__result--ok"
                      : "coach-history__result coach-history__result--bad"
                  }
                >
                  {item.isCorrect ? `صحيحة (+${item.pointsDelta})` : "خاطئة"}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="coach-history">
        <TeamArchivePanel
          teamId={firebaseAuth.currentUser?.uid ?? null}
          teamName={teamSummary?.teamName}
        />
      </section>
    </CompetitionGradientShell>
  );
}
