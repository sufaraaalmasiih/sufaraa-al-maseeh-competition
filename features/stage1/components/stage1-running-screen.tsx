"use client";

import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useMemo, useState } from "react";
import { ArenaLayout } from "@/components/competition/arena-layout";
import { StepJourney } from "@/components/competition/step-journey";
import { QuestionPrompt } from "@/components/competition/question-prompt";
import { QuestionTransition } from "@/components/motion/question-transition";
import { EmptyState } from "@/components/layout/empty-state";
import { ErrorState, LoadingState } from "@/components/layout/state-view";
import { useCompetitionTimer } from "@/features/gameflow/use-competition-timer";
import { useGameFlow } from "@/features/gameflow/use-game-flow";
import { Stage1QuestionCard } from "@/features/stage1/components/stage1-question-card";
import { STAGE1_MID_QUESTION_ADVANCE_MS } from "@/features/stage1/stage1-constants";
import { confirmStage1Answer } from "@/features/stage1/confirm-stage1-answer";
import {
  getStage1Question,
  getStage1QuestionCount,
  isStage1BankComplete,
} from "@/features/stage1/stage1-question-bank";
import { getStage1QuestionTypeLabel } from "@/features/stage1/stage1-types";
import { useStage1BankSync } from "@/features/facilitator/stage1-question-bank-store";
import { useStage1TeamProgress } from "@/features/stage1/use-stage1-team-progress";
import { firebaseAuth } from "@/firebase/firebaseClient";
import { formatSaveErrorFromCode } from "@/lib/format-save-error";
import { realLoadingDebug } from "@/lib/real-loading-debug";

export function Stage1RunningScreen() {
  const [teamId, setTeamId] = useState<string | null>(null);
  const [optimisticIndex, setOptimisticIndex] = useState<number | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answerText, setAnswerText] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [bankCompletedLocally, setBankCompletedLocally] = useState(false);

  useStage1BankSync();

  const questionCount = getStage1QuestionCount();

  const {
    questionIndex: remoteIndex,
    stage1Score,
    loading: progressLoading,
    error: progressError,
  } = useStage1TeamProgress();
  const { timer, isSubmitExpired } = useCompetitionTimer();
  const { status } = useGameFlow();
  const hasStage1Timer = Boolean(timer?.active && timer.stage === "stage1");
  const answeringClosed =
    (status !== null && status !== "stage1_running") ||
    Boolean(hasStage1Timer && isSubmitExpired);

  const effectiveIndex =
    optimisticIndex !== null ? Math.max(remoteIndex, optimisticIndex) : remoteIndex;

  const bankCompleted =
    bankCompletedLocally || isStage1BankComplete(effectiveIndex);

  const currentQuestion = getStage1Question(effectiveIndex);

  const arrangeShuffleSeed = useMemo(
    () => `${teamId ?? "team"}|${currentQuestion?.id ?? effectiveIndex}`,
    [teamId, currentQuestion?.id, effectiveIndex],
  );

  useEffect(() => {
    realLoadingDebug("Stage1RunningScreen", "component mounted (lazy loaded)");
  }, []);

  useEffect(() => {
    realLoadingDebug("Stage1RunningScreen", "render branch update", {
      progressLoading,
      progressError,
      teamId,
      status,
    });
  }, [progressError, progressLoading, status, teamId]);

  useEffect(() => {
    return onAuthStateChanged(firebaseAuth, (user) => {
      setTeamId(user?.uid ?? null);
    });
  }, []);

  useEffect(() => {
    if (optimisticIndex !== null && remoteIndex >= optimisticIndex) {
      setOptimisticIndex(null);
    }
  }, [remoteIndex, optimisticIndex]);

  useEffect(() => {
    if (isStage1BankComplete(remoteIndex)) {
      setBankCompletedLocally(true);
    }
  }, [remoteIndex]);

  useEffect(() => {
    setSelectedAnswer(null);
    setAnswerText("");
    setConfirmed(false);
    setSaveError(null);
  }, [effectiveIndex]);

  function resetAnswerForm() {
    setSelectedAnswer(null);
    setAnswerText("");
    setConfirmed(false);
    setSaveError(null);
  }

  function advanceToNextQuestion(nextIndex: number) {
    setOptimisticIndex(nextIndex);
    resetAnswerForm();
  }

  async function confirmAnswer(answerOverride?: string) {
    const answer =
      answerOverride ??
      (currentQuestion?.type === "missing" || currentQuestion?.type === "fill_blank"
        ? answerText.trim()
        : selectedAnswer);

    if (
      !currentQuestion ||
      !answer ||
      saving ||
      confirmed ||
      answeringClosed ||
      bankCompleted
    ) {
      return;
    }

    const wasLastQuestion = effectiveIndex + 1 >= questionCount;

    setSaving(true);
    setSaveError(null);
    try {
      await confirmStage1Answer({
        question: currentQuestion,
        questionIndex: effectiveIndex,
        answer,
      });
      setConfirmed(true);
      setSaving(false);

      if (wasLastQuestion) {
        setBankCompletedLocally(true);
        return;
      }

      window.setTimeout(() => {
        advanceToNextQuestion(effectiveIndex + 1);
      }, STAGE1_MID_QUESTION_ADVANCE_MS);
    } catch (error) {
      setSaveError(formatSaveErrorFromCode(error));
      setSaving(false);
    }
  }

  if (progressLoading) {
    return <LoadingState variant="page" waitingComponent="Stage1RunningScreen:useStage1TeamProgress" />;
  }

  if (progressError) {
    return <ErrorState title="تعذر تحميل التقدم" description={progressError} />;
  }

  if (bankCompleted) {
    return null;
  }

  if (answeringClosed) {
    return <EmptyState title="انتهى وقت المرحلة، بانتظار توجيه الميسر" />;
  }

  if (!currentQuestion) {
    return <EmptyState title="انتهت أسئلة المرحلة، بانتظار توجيه الميسر" />;
  }

  return (
    <QuestionTransition questionKey={`stage1-q-${effectiveIndex}`}>
      <ArenaLayout
        question={
        <QuestionPrompt
          reference={"reference" in currentQuestion ? currentQuestion.reference : undefined}
          imageUrl={currentQuestion.imageUrl}
          size="arena"
        >
          {currentQuestion.prompt}
        </QuestionPrompt>
      }
      questionNumber={effectiveIndex + 1}
      questionTypeLabel={currentQuestion.typeLabel ?? getStage1QuestionTypeLabel(currentQuestion.type)}
      totalQuestions={questionCount}
      progress={<StepJourney current={effectiveIndex + 1} total={questionCount} />}
      board={
        <Stage1QuestionCard
          answerText={answerText}
          arrangeShuffleSeed={arrangeShuffleSeed}
          confirmed={confirmed}
          interactionOnly
          question={currentQuestion}
          questionNumber={effectiveIndex + 1}
          saveError={saveError}
          saving={saving}
          selectedAnswer={selectedAnswer}
          totalQuestions={questionCount}
          onAnswerTextChange={setAnswerText}
          onConfirm={confirmAnswer}
          onSelectAnswer={(answer) => {
            setSelectedAnswer((current) => (current === answer ? null : answer));
            setSaveError(null);
          }}
        />
      }
    />
    </QuestionTransition>
  );
}
