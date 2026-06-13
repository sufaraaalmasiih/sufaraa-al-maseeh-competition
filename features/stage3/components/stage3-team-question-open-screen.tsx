"use client";

import { useEffect, useRef, useState } from "react";
import { ErrorState, LoadingState } from "@/components/layout/state-view";
import { TimerCountdown } from "@/features/gameflow/components/timer-countdown";
import { useCompetitionTimer } from "@/features/gameflow/use-competition-timer";
import { useGameFlow } from "@/features/gameflow/use-game-flow";
import { Stage3AnswerCard } from "@/features/stage3/components/stage3-answer-card";
import { Stage3QuestionOpenScreen } from "@/features/stage3/components/stage3-question-open-screen";
import {
  confirmStage3Answer,
  confirmStage3Pass,
} from "@/features/stage3/confirm-stage3-answer";
import { finalizeStage3OwnerNoAnswer } from "@/features/stage3/finalize-stage3-owner-no-answer";
import { getStage3MockQuestion } from "@/features/stage3/stage3-mock-questions";
import { useStage3MyAnswer } from "@/features/stage3/use-stage3-my-answer";

function formatStage3SaveError(error: unknown): string {
  const message = error instanceof Error ? error.message : "";

  if (message.includes("timer expired") || message.includes("not active")) {
    return "انتهى وقت الإجابة.";
  }

  if (message.includes("not accepting answers")) {
    return "لم يعد بإمكانك الإجابة على هذا السؤال.";
  }

  if (message.includes("invalid data") || message.includes("undefined")) {
    return "تعذر حفظ الإجابة. حاول مرة أخرى.";
  }

  return message || "تعذر حفظ الإجابة. حاول مرة أخرى.";
}

export function Stage3TeamQuestionOpenScreen() {
  const { stage3ActiveQuestion, stage3OwnerTeamId, stage3OwnerTeamName } = useGameFlow();
  const { timer, remainingSeconds, isExpired } = useCompetitionTimer();
  const { teamId, answerState, loading: answerLoading } = useStage3MyAnswer(
    stage3ActiveQuestion?.id ?? null,
  );
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [passed, setPassed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const ownerNoAnswerAttemptedRef = useRef(false);

  const mockQuestion = stage3ActiveQuestion
    ? getStage3MockQuestion(stage3ActiveQuestion.id)
    : null;
  const isOwner = Boolean(
    teamId && stage3OwnerTeamId && teamId === stage3OwnerTeamId,
  );
  const answeringClosed =
    isExpired ||
    !timer?.active ||
    timer.stage !== "stage3" ||
    timer.purpose !== "answering";

  useEffect(() => {
    if (answerState?.confirmed) {
      setConfirmed(true);
      setPassed(answerState.passed);
      setSelectedAnswer(answerState.passed ? null : answerState.answer);
    }
  }, [answerState]);

  useEffect(() => {
    ownerNoAnswerAttemptedRef.current = false;
  }, [stage3ActiveQuestion?.id]);

  useEffect(() => {
    if (
      !isOwner ||
      !isExpired ||
      confirmed ||
      answerState?.confirmed ||
      ownerNoAnswerAttemptedRef.current ||
      !stage3ActiveQuestion
    ) {
      return;
    }

    ownerNoAnswerAttemptedRef.current = true;

    void finalizeStage3OwnerNoAnswer()
      .then(() => {
        setConfirmed(true);
        setPassed(false);
      })
      .catch((error) => {
        ownerNoAnswerAttemptedRef.current = false;
        setSaveError(
          error instanceof Error
            ? error.message
            : "تعذر تسجيل عدم الإجابة. حاول مرة أخرى.",
        );
      });
  }, [
    isOwner,
    isExpired,
    confirmed,
    answerState?.confirmed,
    stage3ActiveQuestion?.id,
  ]);

  async function handleConfirm() {
    if (!stage3ActiveQuestion || !selectedAnswer) {
      return;
    }

    setSaving(true);
    setSaveError(null);

    try {
      const result = await confirmStage3Answer({
        answer: selectedAnswer,
        questionId: stage3ActiveQuestion.id,
      });
      setConfirmed(true);
      setPassed(result.passed);
    } catch (error) {
      setSaveError(formatStage3SaveError(error));
    } finally {
      setSaving(false);
    }
  }

  async function handlePass() {
    if (!stage3ActiveQuestion || isOwner) {
      return;
    }

    setSaving(true);
    setSaveError(null);

    try {
      await confirmStage3Pass(stage3ActiveQuestion.id);
      setConfirmed(true);
      setPassed(true);
      setSelectedAnswer(null);
    } catch (error) {
      setSaveError(formatStage3SaveError(error));
    } finally {
      setSaving(false);
    }
  }

  if (!stage3ActiveQuestion) {
    return (
      <Stage3QuestionOpenScreen question={null} ownerTeamName={stage3OwnerTeamName} variant="team" />
    );
  }

  if (answerLoading) {
    return <LoadingState />;
  }

  if (!mockQuestion) {
    return (
      <ErrorState
        title="تعذر تحميل السؤال"
        description="لم يتم العثور على محتوى السؤال التجريبي."
      />
    );
  }

  if (!stage3OwnerTeamId) {
    return (
      <ErrorState
        title="لم يحدد الميسر فريق صاحب الدور"
        description="اطلب من الميسر اختيار فريق صاحب الدور قبل فتح السؤال."
      />
    );
  }

  return (
    <div className="stage3-scene">
      <Stage3QuestionOpenScreen
        question={stage3ActiveQuestion}
        ownerTeamName={stage3OwnerTeamName}
        variant="team"
      />

      {timer?.active && timer.stage === "stage3" && timer.purpose === "answering" ? (
        <TimerCountdown
          remainingSeconds={remainingSeconds}
          isExpired={isExpired}
          label="وقت الإجابة"
        />
      ) : null}

      <Stage3AnswerCard
        question={mockQuestion}
        isOwner={isOwner}
        selectedAnswer={selectedAnswer}
        confirmed={confirmed}
        passed={passed}
        saving={saving}
        saveError={saveError}
        disabled={answeringClosed}
        onSelectAnswer={setSelectedAnswer}
        onConfirm={() => {
          void handleConfirm();
        }}
        onPass={
          isOwner
            ? undefined
            : () => {
                void handlePass();
              }
        }
      />
    </div>
  );
}
