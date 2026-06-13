"use client";

import { lazy, Suspense, useEffect, useState } from "react";
import { CompetitionConfirmButton } from "@/components/competition/competition-confirm-button";
import { CompetitionFieldSuccess } from "@/components/competition/competition-field-success";
import { ErrorState, LoadingState } from "@/components/layout/state-view";
import { finishStage2Field } from "@/features/stage2/finish-stage2-field";
import { useTeamStage2Progress } from "@/features/stage2/use-team-stage2-progress";
import { realLoadingDebug } from "@/lib/real-loading-debug";

const Stage2MatchingFieldScreen = lazy(() =>
  import("@/features/stage2/components/stage2-matching-field-screen").then((module) => ({
    default: module.Stage2MatchingFieldScreen,
  })),
);

const Stage2ArrangeVerseFieldScreen = lazy(() =>
  import("@/features/stage2/components/stage2-arrange-verse-field-screen").then((module) => ({
    default: module.Stage2ArrangeVerseFieldScreen,
  })),
);

const Stage2CompleteVerseFieldScreen = lazy(() =>
  import("@/features/stage2/components/stage2-complete-verse-field-screen").then((module) => ({
    default: module.Stage2CompleteVerseFieldScreen,
  })),
);

const Stage2TrueFalseCorrectFieldScreen = lazy(() =>
  import("@/features/stage2/components/stage2-true-false-correct-field-screen").then(
    (module) => ({
      default: module.Stage2TrueFalseCorrectFieldScreen,
    }),
  ),
);

export function Stage2PlayerTurnsScreen() {
  const { teamId, roles, progress, loading, error } = useTeamStage2Progress();
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [completedFieldLabel, setCompletedFieldLabel] = useState<string | null>(null);

  useEffect(() => {
    realLoadingDebug("Stage2PlayerTurnsScreen", "component mounted (lazy loaded)");
  }, []);

  useEffect(() => {
    const renderBranch = loading
      ? "loading"
      : error
        ? "error"
        : !roles.locked
          ? "roles-not-locked"
          : progress.isComplete
            ? "complete"
            : "field-screen";
    realLoadingDebug("Stage2PlayerTurnsScreen", "render branch update", {
      loading,
      error,
      teamId,
      renderBranch,
    });
  }, [error, loading, progress.isComplete, roles.locked, teamId]);

  useEffect(() => {
    if (!completedFieldLabel) return;
    const timer = window.setTimeout(() => setCompletedFieldLabel(null), 2800);
    return () => window.clearTimeout(timer);
  }, [completedFieldLabel]);

  if (loading) {
    return <LoadingState waitingComponent="Stage2PlayerTurnsScreen:useTeamStage2Progress" />;
  }

  if (error) {
    return <ErrorState title="تعذر تحميل تقدم المرحلة الثانية" description={error} />;
  }

  if (!roles.locked) {
    return (
      <div className="gameplay-stack text-center">
        <p className="competition-hero-question-text text-2xl sm:text-3xl">
          يجب تثبيت توزيع المجالات قبل بدء الأسئلة
        </p>
        <p className="mt-2 text-sm font-semibold text-muted-foreground">
          أكملوا توزيع المجالات وثبّتوه أولاً
        </p>
      </div>
    );
  }

  if (progress.isComplete) {
    return (
      <div className="gameplay-stack text-center">
        <p className="text-5xl" aria-hidden>
          🏆
        </p>
        <p className="mt-3 competition-hero-question-text text-2xl sm:text-3xl">
          أنهيتم كل مجالات المرحلة الثانية!
        </p>
        <p className="mt-2 text-sm font-bold text-[#4F8A10]">بانتظار توجيه الميسر</p>
      </div>
    );
  }

  const currentField = progress.currentField;

  if (!currentField) {
    return (
      <ErrorState
        title="تعذر تحديد المجال الحالي"
        description="حدّث الصفحة. إذا استمرت المشكلة، اطلب من الميسر إعادة ضبط تقدم المرحلة الثانية."
      />
    );
  }

  const resolvedTeamId = teamId ?? "";
  const assignedPlayerName = roles[currentField.key]?.trim() || "غير محدد";
  const isMatchingField = currentField.key === "matching";
  const isArrangeVerseField = currentField.key === "arrangeVerse";
  const isCompleteVerseField = currentField.key === "completeVerse";
  const isTrueFalseCorrectField = currentField.key === "trueFalseCorrect";

  async function handleFinishField() {
    const fieldLabel = currentField?.label;
    if (!teamId || saving || progress.isComplete || !fieldLabel) {
      return;
    }

    setSaving(true);
    setSaveError(null);
    try {
      await finishStage2Field(teamId, progress.stage2FieldIndex);
      setCompletedFieldLabel(fieldLabel);
    } catch {
      setSaveError("تعذر حفظ التقدم. تحقق من الاتصال وحاول مرة أخرى.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      {completedFieldLabel ? (
        <CompetitionFieldSuccess fieldLabel={completedFieldLabel} />
      ) : null}

      {!teamId ? (
        <ErrorState
          title="تعذر تحديد الفريق"
          description="حدّث الصفحة أو أعد تسجيل الدخول ثم حاول مرة أخرى."
        />
      ) : isMatchingField ? (
        <Suspense
          fallback={
            <LoadingState waitingComponent="Stage2PlayerTurnsScreen:Stage2MatchingFieldScreen Suspense" />
          }
        >
          <Stage2MatchingFieldScreen
            assignedPlayerName={assignedPlayerName}
            matchingQuestionIndex={progress.stage2QuestionIndex}
          />
        </Suspense>
      ) : isArrangeVerseField ? (
        <Suspense
          fallback={
            <LoadingState waitingComponent="Stage2PlayerTurnsScreen:Stage2ArrangeVerseFieldScreen Suspense" />
          }
        >
          <Stage2ArrangeVerseFieldScreen
            assignedPlayerName={assignedPlayerName}
            arrangeVerseQuestionIndex={progress.stage2QuestionIndex}
            teamId={resolvedTeamId}
          />
        </Suspense>
      ) : isCompleteVerseField ? (
        <Suspense
          fallback={
            <LoadingState waitingComponent="Stage2PlayerTurnsScreen:Stage2CompleteVerseFieldScreen Suspense" />
          }
        >
          <Stage2CompleteVerseFieldScreen
            assignedPlayerName={assignedPlayerName}
            completeVerseQuestionIndex={progress.stage2QuestionIndex}
          />
        </Suspense>
      ) : isTrueFalseCorrectField ? (
        <Suspense
          fallback={
            <LoadingState waitingComponent="Stage2PlayerTurnsScreen:Stage2TrueFalseCorrectFieldScreen Suspense" />
          }
        >
          <Stage2TrueFalseCorrectFieldScreen
            assignedPlayerName={assignedPlayerName}
            trueFalseCorrectQuestionIndex={progress.stage2QuestionIndex}
          />
        </Suspense>
      ) : (
        <p className="arena-question-text text-center text-xl">
          سيتم بناء أسئلة هذا المجال في الخطوة القادمة
        </p>
      )}
      <div className="mt-2 space-y-2">
        {saveError ? (
          <ErrorState title="تعذر حفظ التقدم" description={saveError} />
        ) : null}
        <CompetitionConfirmButton
          className="max-w-md mx-auto"
          disabled={saving || !teamId}
          onClick={() => {
            void handleFinishField();
          }}
        >
          {saving ? "جاري الحفظ..." : "إنهاء هذا المجال التجريبي"}
        </CompetitionConfirmButton>
      </div>
    </>
  );
}
