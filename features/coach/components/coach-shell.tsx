"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { CompetitionBrandHeaderCard } from "@/components/competition/competition-brand-header-card";
import { CompetitionFrozenBanner } from "@/components/layout/competition-frozen-banner";
import { CompetitionGradientShell } from "@/components/layout/competition-gradient-shell";
import { ErrorState, LoadingState } from "@/components/layout/state-view";
import { useCoachDashboard } from "@/features/coach/use-coach-dashboard";
import { useGameFlow } from "@/features/gameflow/use-game-flow";
import { setCoachViewMode } from "@/lib/coach-view-mode";

export function CoachShell() {
  const router = useRouter();
  const { competitionFrozen } = useGameFlow();
  const { stageName, teamSummary, history, loading, error } = useCoachDashboard();

  useEffect(() => {
    setCoachViewMode("coach");
  }, []);

  if (loading) {
    return (
      <CompetitionGradientShell
        centerContent
        className="coach-shell coach-shell--loading app-viewport-fill"
        contentClassName="coach-shell__loading"
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
        contentClassName="coach-shell__loading"
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
        <button
          type="button"
          className="coach-shell__cta"
          onClick={() => {
            setCoachViewMode("player");
            router.push("/team?view=player");
          }}
        >
          الانتقال لشاشة المتسابق
        </button>
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
        {history.length === 0 ? (
          <p className="coach-history__empty">لا توجد أسئلة مُعلنة بعد لفرقك.</p>
        ) : (
          <ul className="coach-history__list">
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
    </CompetitionGradientShell>
  );
}
