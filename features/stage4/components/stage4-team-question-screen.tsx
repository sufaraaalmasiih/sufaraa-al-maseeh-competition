"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ErrorState, LoadingState } from "@/components/layout/state-view";
import { useGameFlow } from "@/features/gameflow/use-game-flow";
import { Stage1QuestionCard } from "@/features/stage1/components/stage1-question-card";
import type { Stage1MockQuestion } from "@/features/stage1/stage1-types";
import { Stage4QuestionDisplay } from "@/features/stage4/components/stage4-question-display";
import { Stage4TeamStatusScreen } from "@/features/stage4/components/stage4-team-status-screen";
import {
  confirmStage4Answer,
  confirmStage4Pass,
} from "@/features/stage4/confirm-stage4-answer";
import { isStage4FlexibleType } from "@/features/stage4/stage4-question-types";
import { useStage4MyAnswer } from "@/features/stage4/use-stage4-my-answer";
import { GameReadyButton } from "@/components/ui/game-ready-button";
import { Input } from "@/components/ui/input";
import { formatSaveErrorFromCode } from "@/lib/format-save-error";

function formatSaveError(error: unknown): string {
  const message = error instanceof Error ? error.message : "";

  if (message.includes("not accepting answers")) {
    return "لم يعد بإمكانك الإجابة على هذا السؤال.";
  }

  return formatSaveErrorFromCode(error);
}

export function Stage4TeamQuestionScreen() {
  const {
    stage4ActiveQuestion,
    stage4QuestionIndex,
    stage4QuestionCount,
    status,
  } = useGameFlow();
  const { answerState, loading: answerLoading } = useStage4MyAnswer(
    stage4ActiveQuestion?.id ?? null,
  );
  const [answerText, setAnswerText] = useState("");
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [passedAnswer, setPassedAnswer] = useState(false);
  const sawQuestionRef = useRef(false);

  const questionOpen = status === "stage4_question_open";

  useEffect(() => {
    sawQuestionRef.current = false;
  }, [stage4QuestionIndex]);

  useEffect(() => {
    if (stage4ActiveQuestion) {
      sawQuestionRef.current = true;
    }
  }, [stage4ActiveQuestion]);

  const flexibleQuestion = useMemo((): Stage1MockQuestion | null => {
    if (!stage4ActiveQuestion || !isStage4FlexibleType(stage4ActiveQuestion.type)) {
      return null;
    }

    return stage4ActiveQuestion as Stage1MockQuestion;
  }, [stage4ActiveQuestion]);

  const arrangeShuffleSeed = `${stage4ActiveQuestion?.id ?? "stage4"}-arrange`;

  useEffect(() => {
    if (answerState?.confirmed) {
      setSubmitted(true);
      setAnswerText(answerState.passed ? "" : answerState.answerText);
      setSelectedAnswer(answerState.passed ? null : answerState.answerText);
      setPassedAnswer(answerState.passed);
    } else {
      setSubmitted(false);
      setPassedAnswer(false);
    }
  }, [answerState, stage4ActiveQuestion?.id]);

  useEffect(() => {
    setAnswerText("");
    setSelectedAnswer(null);
    setSubmitted(false);
    setPassedAnswer(false);
    setSaveError(null);
  }, [stage4ActiveQuestion?.id]);

  if (answerLoading) {
    return <LoadingState variant="page" />;
  }

  if (questionOpen && !stage4ActiveQuestion) {
    return <LoadingState variant="page" waitingComponent="Stage4TeamQuestionScreen:question" />;
  }

  if (!questionOpen && !sawQuestionRef.current && !submitted && !answerState?.confirmed) {
    return (
      <Stage4TeamStatusScreen
        panelTitle="بانتظار السؤال التالي"
        panelSubtitle="ستظهر بطاقة السؤال هنا عندما يفتحها الميسر."
        questionIndex={stage4QuestionIndex}
        questionCount={stage4QuestionCount}
        tone="waiting"
      />
    );
  }

  const closed = !questionOpen;

  async function submitAnswer(answer: string) {
    if (!stage4ActiveQuestion || saving || submitted || closed) {
      return;
    }

    const trimmed = answer.trim();

    if (!trimmed) {
      setSaveError("أدخل إجابتك قبل الإرسال.");
      return;
    }

    setSaving(true);
    setSaveError(null);

    try {
      const result = await confirmStage4Answer({
        answer: trimmed,
        questionId: stage4ActiveQuestion.id,
      });

      if (!result.duplicate) {
        setSubmitted(true);
        setPassedAnswer(result.passed);
      }
    } catch (error) {
      setSaveError(formatSaveError(error));
    } finally {
      setSaving(false);
    }
  }

  async function handlePass() {
    if (!stage4ActiveQuestion || saving || submitted || closed) {
      return;
    }

    setSaving(true);
    setSaveError(null);

    try {
      const result = await confirmStage4Pass(stage4ActiveQuestion.id);

      if (!result.duplicate) {
        setSubmitted(true);
        setPassedAnswer(result.passed);
      }
    } catch (error) {
      setSaveError(formatSaveError(error));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="gameplay-scene gameplay-scene--centered stage4-scene stage4-scene--question-open">
      <div className="gameplay-flow">
        <section className="gameplay-board-card stage4-unified-card stage4-unified-card--glass stage4-team-card stage4-question-open-card">
          <header className="stage4-question-top">
            <div className="stage4-question-top__meta">
              <div className="stage4-question-top__bar">
                <div className="stage4-question-top__lead">
                  <p className="stage4-question-top__label">اثبتوا بالحق</p>
                  <p className="stage4-question-top__progress">
                    السؤال {stage4QuestionIndex + 1} من {stage4QuestionCount}
                  </p>
                </div>
                {stage4ActiveQuestion ? (
                  <span className="stage4-question-top__type-badge">
                    {stage4ActiveQuestion.prompt}
                  </span>
                ) : null}
              </div>
            </div>
          </header>

          <Stage4QuestionDisplay
            question={stage4ActiveQuestion}
            questionIndex={stage4QuestionIndex}
            questionCount={stage4QuestionCount}
            variant="team"
            embedded
            hideMeta
          />

          <div className="stage4-answer-zone stage4-answer-zone--interactive">
            {saveError ? <ErrorState title="تعذر الحفظ" description={saveError} /> : null}

            {submitted ? (
              <p className="stage4-answer-zone__status">
                {passedAnswer
                  ? "تم تسجيل التخطي، بانتظار بقية الفرق"
                  : "تم استلام إجابتكم، بانتظار بقية الفرق"}
              </p>
            ) : closed ? (
              <p className="stage4-answer-zone__status">
                تم إغلاق الإجابات، بانتظار الإعلان
              </p>
            ) : flexibleQuestion ? (
              <div className="stage4-answer-zone__flexible">
                <Stage1QuestionCard
                  answerText={answerText}
                  arrangeShuffleSeed={arrangeShuffleSeed}
                  confirmed={submitted}
                  interactionOnly
                  question={flexibleQuestion}
                  questionNumber={stage4QuestionIndex + 1}
                  saveError={saveError}
                  saving={saving}
                  selectedAnswer={selectedAnswer}
                  totalQuestions={stage4QuestionCount}
                  onAnswerTextChange={setAnswerText}
                  onConfirm={(answer) => {
                    void submitAnswer(answer ?? "");
                  }}
                  onSelectAnswer={setSelectedAnswer}
                />
                <div className="game-ready-btn-wrap">
                  <GameReadyButton
                    type="button"
                    className="game-ready-btn--outline"
                    data-sound="ui_cancel"
                    disabled={saving}
                    onClick={() => void handlePass()}
                  >
                    تخطي / Pass
                  </GameReadyButton>
                </div>
              </div>
            ) : (
              <div className="stage4-answer-zone__text">
                <p className="stage4-answer-zone__title">إجابتكم</p>
                <Input
                  value={answerText}
                  onChange={(event) => setAnswerText(event.target.value)}
                  placeholder="اكتب إجابتكم هنا"
                  disabled={saving}
                  className="stage4-answer-zone__input"
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !saving) {
                      void submitAnswer(answerText);
                    }
                  }}
                />
                <div className="stage4-answer-zone__actions">
                  <div className="game-ready-btn-wrap">
                    <GameReadyButton
                      type="button"
                      data-sound="answer_submit"
                      disabled={saving || !answerText.trim()}
                      onClick={() => void submitAnswer(answerText)}
                    >
                      {saving ? "جاري الإرسال..." : "إرسال الإجابة"}
                    </GameReadyButton>
                  </div>
                  <div className="game-ready-btn-wrap">
                    <GameReadyButton
                      type="button"
                      className="game-ready-btn--outline"
                      data-sound="ui_cancel"
                      disabled={saving}
                      onClick={() => void handlePass()}
                    >
                      تخطي / Pass
                    </GameReadyButton>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
