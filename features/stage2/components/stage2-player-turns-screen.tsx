"use client";

import { useEffect } from "react";
import { ErrorState, LoadingState } from "@/components/layout/state-view";
import { Stage2ArrangeVerseFieldScreen } from "@/features/stage2/components/stage2-arrange-verse-field-screen";
import { Stage2CompleteVerseFieldScreen } from "@/features/stage2/components/stage2-complete-verse-field-screen";
import { Stage2MatchingFieldScreen } from "@/features/stage2/components/stage2-matching-field-screen";
import { Stage2TrueFalseCorrectFieldScreen } from "@/features/stage2/components/stage2-true-false-correct-field-screen";
import { useTeamStage2Progress } from "@/features/stage2/use-team-stage2-progress";
import { realLoadingDebug } from "@/lib/real-loading-debug";

export function Stage2PlayerTurnsScreen() {
  const { teamId, roles, progress, loading, error } = useTeamStage2Progress();

  useEffect(() => {
    realLoadingDebug("Stage2PlayerTurnsScreen", "component mounted");
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

  if (loading) {
    return <LoadingState variant="page" waitingComponent="Stage2PlayerTurnsScreen:useTeamStage2Progress" />;
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
    return null;
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

  if (!teamId) {
    return (
      <ErrorState
        title="تعذر تحديد الفريق"
        description="حدّث الصفحة أو أعد تسجيل الدخول ثم حاول مرة أخرى."
      />
    );
  }

  if (isMatchingField) {
    return (
      <Stage2MatchingFieldScreen
        assignedPlayerName={assignedPlayerName}
        matchingQuestionIndex={progress.stage2QuestionIndex}
      />
    );
  }

  if (isArrangeVerseField) {
    return (
      <Stage2ArrangeVerseFieldScreen
        assignedPlayerName={assignedPlayerName}
        arrangeVerseQuestionIndex={progress.stage2QuestionIndex}
        teamId={resolvedTeamId}
      />
    );
  }

  if (isCompleteVerseField) {
    return (
      <Stage2CompleteVerseFieldScreen
        assignedPlayerName={assignedPlayerName}
        completeVerseQuestionIndex={progress.stage2QuestionIndex}
      />
    );
  }

  if (isTrueFalseCorrectField) {
    return (
      <Stage2TrueFalseCorrectFieldScreen
        assignedPlayerName={assignedPlayerName}
        trueFalseCorrectQuestionIndex={progress.stage2QuestionIndex}
      />
    );
  }

  return (
    <p className="arena-question-text text-center text-xl">
      سيتم بناء أسئلة هذا المجال في الخطوة القادمة
    </p>
  );
}
