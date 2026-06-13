"use client";

import { useEffect, useRef, useState } from "react";
import { ErrorState } from "@/components/layout/state-view";
import { useCompetitionTimer } from "@/features/gameflow/use-competition-timer";
import { useStage1Ranking } from "@/features/stage1/use-stage1-ranking";
import { autoCloseAndRevealStage3Question } from "@/features/stage3/auto-close-and-reveal-stage3-question";
import { autoFinishStage3RevealAndReturnBoard } from "@/features/stage3/auto-finish-stage3-reveal-and-return-board";
import { advanceStage3Turn } from "@/features/stage3/advance-stage3-turn";
import { closeStage3Answers } from "@/features/stage3/close-stage3-answers";
import { finishStage3Reveal } from "@/features/stage3/finish-stage3-reveal";
import { handleStage3SelectionTimeout } from "@/features/stage3/handle-stage3-selection-timeout";
import { returnToStage3Board } from "@/features/stage3/return-to-stage3-board";
import { setStage3OwnerTeam } from "@/features/stage3/set-stage3-owner";
import { startStage3OfficialFlow } from "@/features/stage3/start-stage3-official-flow";
import { startStage3Reveal } from "@/features/stage3/start-stage3-reveal";
import { Stage3Board } from "@/features/stage3/components/stage3-board";
import { Stage3FacilitatorAnswersPanel } from "@/features/stage3/components/stage3-facilitator-answers-panel";
import { Stage3FacilitatorResultsPanel } from "@/features/stage3/components/stage3-facilitator-results-panel";
import { Stage3QuestionOpenScreen } from "@/features/stage3/components/stage3-question-open-screen";
import { Stage3RevealResultsTable } from "@/features/stage3/components/stage3-reveal-results-table";
import { Stage3RevealSummary } from "@/features/stage3/components/stage3-reveal-summary";
import { Stage3SelectionTimeoutBanner } from "@/features/stage3/components/stage3-selection-timeout-banner";
import type { Stage3QuestionMetadata } from "@/features/stage3/stage3-question-types";
import type { Stage3SelectionTimeoutNotice } from "@/features/stage3/stage3-selection-timeout-notice";
import { useStage3ActiveAnswers } from "@/features/stage3/use-stage3-active-answers";
import type { GameFlowStatus } from "@/types";

interface Stage3FacilitatorUnifiedPanelProps {
  status: GameFlowStatus;
  openedQuestionIds: string[];
  usedQuestionIds: string[];
  ownerTeamId: string | null;
  ownerTeamName: string | null;
  activeQuestion: Stage3QuestionMetadata | null;
  selectionTimeoutNotice: Stage3SelectionTimeoutNotice | null;
}

export function Stage3FacilitatorUnifiedPanel({
  status,
  openedQuestionIds,
  usedQuestionIds,
  ownerTeamId,
  ownerTeamName,
  activeQuestion,
  selectionTimeoutNotice,
}: Stage3FacilitatorUnifiedPanelProps) {
  const { teams: registeredTeams } = useStage1Ranking();
  const teamOptions = registeredTeams.map((team) => ({
    teamId: team.teamId,
    teamName: team.teamName,
  }));

  const showBoard =
    status === "stage3_board" ||
    status === "stage3_question_open" ||
    status === "stage3_answer_closed" ||
    status === "stage3_reveal" ||
    status === "stage3_results_done";

  if (!showBoard) {
    return null;
  }

  return (
    <div className="flow-workspace-panel flow-cockpit__stage3">
      <Stage3SelectionTimeoutBanner notice={selectionTimeoutNotice} />

      <div className="stage3-facilitator-board-wrap">
        <Stage3FacilitatorToolbar
          status={status}
          openedQuestionIds={openedQuestionIds}
          usedQuestionIds={usedQuestionIds}
          teams={teamOptions}
          ownerTeamId={ownerTeamId}
          ownerTeamName={ownerTeamName}
          activeQuestion={activeQuestion}
        />

        <Stage3Board
          variant="facilitator"
          canChoose={false}
          openedQuestionIds={openedQuestionIds}
          usedQuestionIds={usedQuestionIds}
          ownerTeamName={ownerTeamName}
        />
      </div>

      {status === "stage3_question_open" || status === "stage3_answer_closed" ? (
        <Stage3FacilitatorQuestionBody
          question={activeQuestion}
          ownerTeamName={ownerTeamName}
        />
      ) : null}

      {status === "stage3_reveal" ? (
        <Stage3FacilitatorRevealBody
          question={activeQuestion}
          ownerTeamName={ownerTeamName}
        />
      ) : null}

      {status === "stage3_results_done" ? (
        <Stage3FacilitatorResultsPanel
          question={activeQuestion}
          ownerTeamName={ownerTeamName}
        />
      ) : null}
    </div>
  );
}

interface Stage3FacilitatorToolbarProps {
  status: GameFlowStatus;
  openedQuestionIds: string[];
  usedQuestionIds: string[];
  teams: { teamId: string; teamName: string }[];
  ownerTeamId: string | null;
  ownerTeamName: string | null;
  activeQuestion: Stage3QuestionMetadata | null;
}

function Stage3FacilitatorToolbar({
  status,
  openedQuestionIds,
  usedQuestionIds,
  teams,
  ownerTeamId,
  ownerTeamName,
  activeQuestion,
}: Stage3FacilitatorToolbarProps) {
  const { timer, isExpired } = useCompetitionTimer();
  const [selectedOwnerTeamId, setSelectedOwnerTeamId] = useState(ownerTeamId ?? "");
  const [starting, setStarting] = useState(false);
  const [rotating, setRotating] = useState(false);
  const [savingOwner, setSavingOwner] = useState(false);
  const [closing, setClosing] = useState(false);
  const [revealing, setRevealing] = useState(false);
  const [returning, setReturning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showEmergency, setShowEmergency] = useState(false);
  const selectionTimeoutAttemptedRef = useRef(false);
  const autoRevealAttemptedRef = useRef(false);
  const autoReturnAttemptedRef = useRef(false);

  const officialStarted = Boolean(ownerTeamId);
  const isBoard = status === "stage3_board";
  const isQuestionOpen = status === "stage3_question_open";
  const isAnswerClosed = status === "stage3_answer_closed";
  const isReveal = status === "stage3_reveal";

  useEffect(() => {
    setSelectedOwnerTeamId(ownerTeamId ?? "");
  }, [ownerTeamId]);

  useEffect(() => {
    selectionTimeoutAttemptedRef.current = false;
  }, [ownerTeamId, timer?.endsAtMs]);

  useEffect(() => {
    autoRevealAttemptedRef.current = false;
  }, [activeQuestion?.id]);

  useEffect(() => {
    autoReturnAttemptedRef.current = false;
  }, [activeQuestion?.id]);

  useEffect(() => {
    if (
      selectionTimeoutAttemptedRef.current ||
      !isExpired ||
      !timer?.active ||
      timer.stage !== "stage3" ||
      timer.purpose !== "selection"
    ) {
      return;
    }

    selectionTimeoutAttemptedRef.current = true;
    void handleStage3SelectionTimeout().catch(() => {
      selectionTimeoutAttemptedRef.current = false;
    });
  }, [isExpired, timer?.active, timer?.endsAtMs, timer?.purpose, timer?.stage]);

  useEffect(() => {
    if (autoRevealAttemptedRef.current) {
      return;
    }

    const isStage3AnsweringTimer =
      timer?.stage === "stage3" && timer?.purpose === "answering";
    const timerEnded =
      isExpired ||
      (typeof timer?.endsAtMs === "number" && timer.endsAtMs <= Date.now());

    if (!timerEnded || !isStage3AnsweringTimer) {
      return;
    }

    if (isQuestionOpen || isAnswerClosed) {
      autoRevealAttemptedRef.current = true;
      void autoCloseAndRevealStage3Question().catch(() => {
        autoRevealAttemptedRef.current = false;
      });
    }
  }, [
    isQuestionOpen,
    isAnswerClosed,
    isExpired,
    timer?.active,
    timer?.endsAtMs,
    timer?.purpose,
    timer?.stage,
  ]);

  useEffect(() => {
    if (
      !isExpired ||
      autoReturnAttemptedRef.current ||
      !timer?.active ||
      timer.stage !== "stage3" ||
      timer.purpose !== "reveal"
    ) {
      return;
    }

    autoReturnAttemptedRef.current = true;
    void autoFinishStage3RevealAndReturnBoard().catch(() => {
      autoReturnAttemptedRef.current = false;
    });
  }, [isExpired, timer?.active, timer?.purpose, timer?.stage]);

  async function handleStartOfficialFlow() {
    setStarting(true);
    setError(null);
    try {
      await startStage3OfficialFlow();
    } catch {
      setError("تعذر بدء المرحلة الرسمية.");
    } finally {
      setStarting(false);
    }
  }

  async function handleRotateTurn() {
    setRotating(true);
    setError(null);
    try {
      await advanceStage3Turn({ rotateOwner: true });
    } catch {
      setError("تعذر تغيير الدور.");
    } finally {
      setRotating(false);
    }
  }

  async function handleSaveOwnerOverride() {
    const selected = teams.find((team) => team.teamId === selectedOwnerTeamId);
    if (!selected) {
      setError("اختر فريقاً للتدخل اليدوي.");
      return;
    }

    setSavingOwner(true);
    setError(null);
    try {
      await setStage3OwnerTeam(selected.teamId, selected.teamName);
    } catch {
      setError("تعذر حفظ تدخل الميسّر.");
    } finally {
      setSavingOwner(false);
    }
  }

  async function handleCloseAnswers() {
    setClosing(true);
    setError(null);
    try {
      await closeStage3Answers();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "تعذر إغلاق الإجابات.");
    } finally {
      setClosing(false);
    }
  }

  async function handleStartReveal() {
    setRevealing(true);
    setError(null);
    try {
      await startStage3Reveal();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "تعذر بدء الإعلان.");
    } finally {
      setRevealing(false);
    }
  }

  async function handleManualReturnBoard() {
    setReturning(true);
    setError(null);
    try {
      await finishStage3Reveal();
      await returnToStage3Board();
    } catch {
      setError("تعذر العودة إلى اللوحة.");
    } finally {
      setReturning(false);
    }
  }

  return (
    <div className="stage3-facilitator-toolbar">
      {error ? <ErrorState title="تعذر المتابعة" description={error} /> : null}

      <div className="stage3-facilitator-toolbar__row">
        <div className="stage3-facilitator-toolbar__status">
          <span className="stage3-facilitator-toolbar__label">صاحب الدور</span>
          <strong>{ownerTeamName ?? "لم يُحدد"}</strong>
        </div>
        <div className="stage3-facilitator-toolbar__status">
          <span className="stage3-facilitator-toolbar__label">مُستخدمة</span>
          <strong>{usedQuestionIds.length}</strong>
        </div>
        <div className="stage3-facilitator-toolbar__status">
          <span className="stage3-facilitator-toolbar__label">مفتوحة</span>
          <strong>{openedQuestionIds.length}</strong>
        </div>
      </div>

      <div className="facilitator-action-bar">
        {isBoard && !officialStarted ? (
          <button
            type="button"
            className="facilitator-btn facilitator-btn--primary"
            disabled={starting}
            onClick={() => void handleStartOfficialFlow()}
          >
            {starting ? "جاري البدء..." : "بدء المرحلة الرسمية"}
          </button>
        ) : null}

        {isBoard && officialStarted ? (
          <>
            <button
              type="button"
              className="facilitator-btn facilitator-btn--outline"
              disabled={rotating}
              onClick={() => void handleRotateTurn()}
            >
              {rotating ? "جاري التغيير..." : "تغيير الدور"}
            </button>
            <button
              type="button"
              className="facilitator-btn facilitator-btn--outline"
              onClick={() => setShowEmergency((value) => !value)}
            >
              {showEmergency ? "إخفاء الطوارئ" : "تدخل طوارئ"}
            </button>
          </>
        ) : null}

        {isQuestionOpen ? (
          <button
            type="button"
            className="facilitator-btn facilitator-btn--amber"
            disabled={closing}
            onClick={() => void handleCloseAnswers()}
          >
            {closing ? "جاري الإغلاق..." : "إغلاق الإجابات"}
          </button>
        ) : null}

        {isQuestionOpen || isAnswerClosed ? (
          <button
            type="button"
            className="facilitator-btn facilitator-btn--success"
            disabled={revealing}
            onClick={() => void handleStartReveal()}
          >
            {revealing ? "جاري بدء الإعلان..." : "بدء الإعلان"}
          </button>
        ) : null}

        {isReveal ? (
          <button
            type="button"
            className="facilitator-btn facilitator-btn--outline"
            disabled={returning}
            onClick={() => void handleManualReturnBoard()}
          >
            {returning ? "جاري العودة..." : "العودة للوحة"}
          </button>
        ) : null}
      </div>

      {showEmergency && isBoard && officialStarted ? (
        <div className="stage3-facilitator-toolbar__emergency">
          <select
            className="stage3-facilitator-toolbar__select"
            value={selectedOwnerTeamId}
            onChange={(event) => setSelectedOwnerTeamId(event.target.value)}
          >
            <option value="">— اختر فريقاً —</option>
            {teams.map((team) => (
              <option key={team.teamId} value={team.teamId}>
                {team.teamName}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="facilitator-btn facilitator-btn--outline"
            disabled={!selectedOwnerTeamId || savingOwner}
            onClick={() => void handleSaveOwnerOverride()}
          >
            {savingOwner ? "جاري الحفظ..." : "حفظ التدخل"}
          </button>
        </div>
      ) : null}
    </div>
  );
}

function Stage3FacilitatorQuestionBody({
  question,
  ownerTeamName,
}: {
  question: Stage3QuestionMetadata | null;
  ownerTeamName: string | null;
}) {
  return (
    <div className="stage3-facilitator-context">
      <Stage3QuestionOpenScreen
        question={question}
        ownerTeamName={ownerTeamName}
        variant="facilitator"
      />
      <Stage3FacilitatorAnswersPanel questionId={question?.id ?? null} />
    </div>
  );
}

function Stage3FacilitatorRevealBody({
  question,
  ownerTeamName,
}: {
  question: Stage3QuestionMetadata | null;
  ownerTeamName: string | null;
}) {
  const { answers, loading, error } = useStage3ActiveAnswers(question?.id ?? null);

  return (
    <div className="stage3-facilitator-context">
      <Stage3RevealSummary question={question} ownerTeamName={ownerTeamName} />
      <Stage3RevealResultsTable answers={answers} loading={loading} error={error} />
    </div>
  );
}
