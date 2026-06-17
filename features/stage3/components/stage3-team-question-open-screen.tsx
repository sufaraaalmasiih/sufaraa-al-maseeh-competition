"use client";

import { useEffect, useRef, useState } from "react";
import { ErrorState } from "@/components/layout/state-view";
import { useAuthRole } from "@/hooks/use-auth-role";
import { useCompetitionTimer } from "@/features/gameflow/use-competition-timer";
import { useGameFlow } from "@/features/gameflow/use-game-flow";
import { Stage3AnswerCard } from "@/features/stage3/components/stage3-answer-card";
import { Stage3GameplayHeader } from "@/features/stage3/components/stage3-gameplay-header";
import { Stage3QuestionOpenScreen } from "@/features/stage3/components/stage3-question-open-screen";
import {
  confirmStage3Answer,
  confirmStage3Pass,
} from "@/features/stage3/confirm-stage3-answer";
import { finalizeStage3OwnerNoAnswer } from "@/features/stage3/finalize-stage3-owner-no-answer";
import { getStage3MockQuestionForPlay } from "@/features/stage3/stage3-mock-questions";
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
  const { timer, isExpired } = useCompetitionTimer();
  const { user } = useAuthRole();
  const { answerState } = useStage3MyAnswer(stage3ActiveQuestion?.id ?? null);
  const teamId = user?.uid ?? null;
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answerText, setAnswerText] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [passed, setPassed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const ownerNoAnswerAttemptedRef = useRef(false);

  const mockQuestion = stage3ActiveQuestion
    ? getStage3MockQuestionForPlay(stage3ActiveQuestion.id)
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
      if (answerState.passed) {
        setSelectedAnswer(null);
        setAnswerText("");
      } else {
        setSelectedAnswer(answerState.answer);
        setAnswerText(answerState.answer);
      }
    }
  }, [answerState]);

  useEffect(() => {
    setSelectedAnswer(null);
    setAnswerText("");
    setConfirmed(false);
    setPassed(false);
    setSaveError(null);
  }, [stage3ActiveQuestion?.id]);

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

  async function handleConfirm(answer: string) {
    if (!stage3ActiveQuestion || !answer.trim()) {
      return;
    }

    setSaving(true);
    setSaveError(null);

    try {
      const result = await confirmStage3Answer({
        answer,
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
    <div className="gameplay-scene gameplay-scene--centered stage3-scene stage3-scene--question-open">
      <div className="gameplay-flow">
        <section className="gameplay-board-card stage3-unified-card stage3-unified-card--glass stage3-question-open-card">
          <header className="stage3-question-top">
            <div className="stage3-question-top__meta">
              <Stage3GameplayHeader
                ownerTeamName={stage3OwnerTeamName}
                fieldLabel={stage3ActiveQuestion.fieldLabel}
                questionNumber={stage3ActiveQuestion.questionNumber}
                difficulty={stage3ActiveQuestion.difficulty}
                variant="bar"
              />
            </div>

          </header>

          <Stage3QuestionOpenScreen
            question={stage3ActiveQuestion}
            ownerTeamName={stage3OwnerTeamName}
            variant="team"
            hideHeader
          />

          <Stage3AnswerCard
            question={mockQuestion}
            isOwner={isOwner}
            selectedAnswer={selectedAnswer}
            answerText={answerText}
            confirmed={confirmed}
            passed={passed}
            saving={saving}
            saveError={saveError}
            disabled={answeringClosed}
            onSelectAnswer={setSelectedAnswer}
            onAnswerTextChange={setAnswerText}
            onConfirm={(answer) => {
              void handleConfirm(answer);
            }}
            onPass={
              isOwner
                ? undefined
                : () => {
                    void handlePass();
                  }
            }
          />
        </section>
      </div>
    </div>
  );
}
