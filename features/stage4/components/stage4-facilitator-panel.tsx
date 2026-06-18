"use client";

import { useEffect, useMemo, useState } from "react";
import { ErrorState } from "@/components/layout/state-view";
import { useGameFlow } from "@/features/gameflow/use-game-flow";
import { useStage1Ranking } from "@/features/stage1/use-stage1-ranking";
import { Stage4QuestionDisplay } from "@/features/stage4/components/stage4-question-display";
import { Stage4RevealResultsTable } from "@/features/stage4/components/stage4-reveal-results-table";
import { Stage4WaitingScreen } from "@/features/stage4/components/stage4-waiting-screen";
import { advanceStage4Question } from "@/features/stage4/advance-stage4-question";
import { closeStage4Answers } from "@/features/stage4/close-stage4-answers";
import { openStage4Question } from "@/features/stage4/open-stage4-question";
import { reopenStage4Answers } from "@/features/stage4/reopen-stage4-answers";
import { startStage4 } from "@/features/stage4/start-stage4";
import { startStage4Reveal } from "@/features/stage4/start-stage4-reveal";
import { getStage4MockQuestion } from "@/features/stage4/stage4-mock-questions";
import { STAGE4_NAME } from "@/features/stage4/stage4-constants";
import {
  canCloseStage4AnswersNow,
  stage4AnswerWindowRemainingMs,
} from "@/features/stage4/stage4-answer-window";
import { useStage4ActiveAnswers } from "@/features/stage4/use-stage4-active-answers";
import { getSyncedNowMs } from "@/lib/server-clock-sync";

export function Stage4FacilitatorPanel() {
  const {
    status,
    stage4ActiveQuestion,
    stage4QuestionIndex,
    stage4QuestionCount,
    stage4QuestionOpenedAtMs,
  } = useGameFlow();
  const { teams: registeredTeams } = useStage1Ranking();
  const { answers, loading: answersLoading } = useStage4ActiveAnswers(
    stage4ActiveQuestion?.id ?? null,
  );
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [nowMs, setNowMs] = useState(() => getSyncedNowMs());

  useEffect(() => {
    if (status !== "stage4_question_open") {
      return undefined;
    }

    setNowMs(getSyncedNowMs());
    const intervalId = window.setInterval(() => setNowMs(getSyncedNowMs()), 250);
    return () => window.clearInterval(intervalId);
  }, [status, stage4QuestionOpenedAtMs]);

  const canCloseAnswers = useMemo(
    () => canCloseStage4AnswersNow(stage4QuestionOpenedAtMs, nowMs),
    [stage4QuestionOpenedAtMs, nowMs],
  );
  const answerWindowRemainingMs = useMemo(
    () => stage4AnswerWindowRemainingMs(stage4QuestionOpenedAtMs, nowMs),
    [stage4QuestionOpenedAtMs, nowMs],
  );

  const teamCount = registeredTeams.length;
  const answeredCount = new Set(
    answers.filter((answer) => answer.confirmed).map((answer) => answer.teamId),
  ).size;
  const allResponded = teamCount > 0 && answeredCount >= teamCount;
  const isLastQuestion = stage4QuestionIndex + 1 >= stage4QuestionCount;

  const mockQuestion = useMemo(
    () =>
      stage4ActiveQuestion ? getStage4MockQuestion(stage4ActiveQuestion.id) : null,
    [stage4ActiveQuestion],
  );

  async function runAction(action: string, fn: () => Promise<void>) {
    setPendingAction(action);
    setActionError(null);

    try {
      await fn();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "تعذر تنفيذ الإجراء.");
    } finally {
      setPendingAction(null);
    }
  }

  if (status === "stage4_intro") {
    return (
      <div className="flow-workspace-panel stage4-facilitator-wrap">
        <div className="stage4-facilitator-toolbar">
          <div className="stage4-facilitator-toolbar__head">
            <p className="stage4-facilitator-toolbar__kicker">{STAGE4_NAME}</p>
            <h3 className="stage4-facilitator-toolbar__title">بدء المرحلة الرابعة</h3>
            <p className="stage4-facilitator-toolbar__desc">
              تحدي جماعي — جميع الفرق تجيب على نفس السؤال في الوقت نفسه. اضبط عدد
              الأسئلة ومدة الإجابة في تبويب الإعدادات قبل البدء.
            </p>
          </div>
          <div className="stage4-facilitator-toolbar__setup">
            <button
              type="button"
              className="facilitator-btn facilitator-btn--primary"
              disabled={pendingAction !== null}
              onClick={() => void runAction("start", () => startStage4())}
            >
              {pendingAction === "start" ? "جاري البدء..." : "بدء المرحلة الرابعة"}
            </button>
          </div>
          {actionError ? <ErrorState title="تعذر البدء" description={actionError} /> : null}
        </div>
      </div>
    );
  }

  if (status === "stage4_waiting_question") {
    return (
      <div className="flow-workspace-panel stage4-facilitator-wrap">
        <Stage4WaitingScreen
          questionIndex={stage4QuestionIndex}
          questionCount={stage4QuestionCount}
          variant="facilitator"
        />
        <div className="stage4-facilitator-toolbar">
          <div className="facilitator-action-bar">
            <button
              type="button"
              className="facilitator-btn facilitator-btn--primary"
              disabled={pendingAction !== null}
              onClick={() => void runAction("open", () => openStage4Question())}
            >
              {pendingAction === "open" ? "جاري الفتح..." : "فتح السؤال التالي"}
            </button>
          </div>
          {actionError ? <ErrorState title="تعذر المتابعة" description={actionError} /> : null}
        </div>
      </div>
    );
  }

  if (status === "stage4_question_open" || status === "stage4_answers_closed") {
    return (
      <div className="flow-workspace-panel stage4-facilitator-wrap">
        <Stage4QuestionDisplay
          question={stage4ActiveQuestion}
          questionIndex={stage4QuestionIndex}
          questionCount={stage4QuestionCount}
          variant="facilitator"
        />

        <div className="stage4-facilitator-toolbar">
          <div className="stage4-facilitator-toolbar__row">
            <div className="stage3-facilitator-toolbar__status">
              <span className="stage3-facilitator-toolbar__label">أجابت</span>
              <strong>
                {answeredCount} / {teamCount}
              </strong>
            </div>
            {allResponded ? (
              <p className="facilitator-inline-success">جميع الفرق أجابت — جاهز للإعلان</p>
            ) : null}
          </div>

          <ul className="stage4-facilitator-toolbar__teams">
            {registeredTeams.map((team) => {
              const row = answers.find((answer) => answer.teamId === team.teamId);
              const state = row?.confirmed
                ? row.passed
                  ? "تخطي"
                  : "أجاب"
                : "بانتظار";
              const stateKey = row?.confirmed ? (row.passed ? "passed" : "answered") : "waiting";

              return (
                <li
                  key={team.teamId}
                  className={`stage4-facilitator-toolbar__team stage4-facilitator-toolbar__team--${stateKey}`}
                >
                  <span className="stage4-facilitator-toolbar__team-name">{team.teamName}</span>
                  <span className="stage4-facilitator-toolbar__team-state">{state}</span>
                </li>
              );
            })}
          </ul>

          <div className="facilitator-action-bar">
            {status === "stage4_question_open" ? (
              <>
                {!canCloseAnswers ? (
                  <p className="text-sm font-bold text-[#64748B]">
                    انتظر {Math.ceil(answerWindowRemainingMs / 1000)} ثانية قبل إغلاق الإجابات
                  </p>
                ) : null}
                <button
                  type="button"
                  className="facilitator-btn facilitator-btn--amber"
                  disabled={pendingAction !== null || !canCloseAnswers}
                  onClick={() => void runAction("close", () => closeStage4Answers())}
                >
                  {pendingAction === "close" ? "جاري الإغلاق..." : "إغلاق الإجابات"}
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="facilitator-btn facilitator-btn--outline"
                  disabled={pendingAction !== null}
                  onClick={() => void runAction("reopen", () => reopenStage4Answers())}
                >
                  {pendingAction === "reopen" ? "جاري الفتح..." : "إعادة فتح الإجابات"}
                </button>
                <button
                  type="button"
                  className="facilitator-btn facilitator-btn--success"
                  disabled={pendingAction !== null}
                  onClick={() => void runAction("reveal", () => startStage4Reveal())}
                >
                  {pendingAction === "reveal" ? "جاري الإعلان..." : "بدء الإعلان"}
                </button>
              </>
            )}
          </div>
          {actionError ? <ErrorState title="تعذر المتابعة" description={actionError} /> : null}
        </div>
      </div>
    );
  }

  if (status === "stage4_reveal") {
    return (
      <div className="flow-workspace-panel stage4-facilitator-wrap">
        <Stage4RevealResultsTable
          answers={answers}
          correctAnswer={
            mockQuestion?.correctAnswer ?? stage4ActiveQuestion?.correctAnswer ?? "—"
          }
          loading={answersLoading}
          variant="facilitator"
        />
        <div className="stage4-facilitator-toolbar">
          <div className="facilitator-action-bar">
            <button
              type="button"
              className="facilitator-btn facilitator-btn--primary"
              disabled={pendingAction !== null}
              onClick={() => void runAction("advance", () => advanceStage4Question())}
            >
              {pendingAction === "advance"
                ? "جاري المتابعة..."
                : isLastQuestion
                  ? "إنهاء الأسئلة والمتابعة"
                  : "السؤال التالي"}
            </button>
          </div>
          {actionError ? <ErrorState title="تعذر المتابعة" description={actionError} /> : null}
        </div>
      </div>
    );
  }

  return null;
}
