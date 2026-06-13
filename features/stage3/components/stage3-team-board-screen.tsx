"use client";

import { useState } from "react";
import { ErrorState, LoadingState } from "@/components/layout/state-view";
import { TimerCountdown } from "@/features/gameflow/components/timer-countdown";
import { useCompetitionTimer } from "@/features/gameflow/use-competition-timer";
import { Stage3Board } from "@/features/stage3/components/stage3-board";
import { selectStage3QuestionByOwner } from "@/features/stage3/open-stage3-question";
import { boardQuestionToMetadata } from "@/features/stage3/stage3-question-metadata";
import type { Stage3BoardQuestion } from "@/features/stage3/stage3-board-data";
import { Stage3SelectionTimeoutBanner } from "@/features/stage3/components/stage3-selection-timeout-banner";
import type { Stage3SelectionTimeoutNotice } from "@/features/stage3/stage3-selection-timeout-notice";
import { useTeamStage3Context } from "@/features/stage3/use-team-stage3-context";

interface Stage3TeamBoardScreenProps {
  openedQuestionIds: string[];
  usedQuestionIds: string[];
  ownerTeamId: string | null;
  ownerTeamName: string | null;
  selectionTimeoutNotice: Stage3SelectionTimeoutNotice | null;
}

export function Stage3TeamBoardScreen({
  openedQuestionIds,
  usedQuestionIds,
  ownerTeamId,
  ownerTeamName,
  selectionTimeoutNotice,
}: Stage3TeamBoardScreenProps) {
  const { timer, remainingSeconds, isExpired } = useCompetitionTimer();
  const { teamId, teamName, loading, error } = useTeamStage3Context();
  const [selectingQuestionId, setSelectingQuestionId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState title="تعذر تحميل بيانات الفريق" description={error} />;
  }

  const isOwner = Boolean(teamId && ownerTeamId && teamId === ownerTeamId);
  const ownerReady = Boolean(ownerTeamId);
  const isSelectionTimer =
    timer?.active && timer.stage === "stage3" && timer.purpose === "selection";

  async function handleSelectQuestion(question: Stage3BoardQuestion, fieldLabel: string) {
    if (!teamId || !isOwner || selectingQuestionId) {
      return;
    }

    if (usedQuestionIds.includes(question.id)) {
      setActionError("هذا السؤال مُستخدم ولا يمكن اختياره مرة أخرى.");
      return;
    }

    setSelectingQuestionId(question.id);
    setActionError(null);

    try {
      await selectStage3QuestionByOwner({
        question: boardQuestionToMetadata(question, fieldLabel),
        callerTeamId: teamId,
        callerTeamName: teamName,
      });
    } catch {
      setActionError("تعذر فتح السؤال. تأكد أنك فريق صاحب الدور وأن السؤال لم يُستخدم.");
    } finally {
      setSelectingQuestionId(null);
    }
  }

  return (
    <div className="stage3-scene">
      <Stage3SelectionTimeoutBanner notice={selectionTimeoutNotice} />
      <TurnBanner
        isOwner={isOwner}
        ownerReady={ownerReady}
        ownerTeamName={ownerTeamName}
        teamName={teamName}
      />

      {isSelectionTimer ? (
        <TimerCountdown
          remainingSeconds={remainingSeconds}
          isExpired={isExpired}
          label={isOwner ? "وقت اختيار السؤال" : "وقت اختيار صاحب الدور"}
        />
      ) : null}

      {actionError ? <ErrorState title="تعذر المتابعة" description={actionError} /> : null}

      <Stage3Board
        variant="team"
        canChoose={isOwner && !isExpired}
        pendingQuestionId={selectingQuestionId}
        openedQuestionIds={openedQuestionIds}
        usedQuestionIds={usedQuestionIds}
        ownerTeamName={ownerTeamName}
        onSelectQuestion={(question, fieldLabel) => {
          void handleSelectQuestion(question, fieldLabel);
        }}
      />

      {selectingQuestionId ? (
        <p className="text-center text-base font-bold text-[#143A5A]">جاري فتح التحدي...</p>
      ) : null}
    </div>
  );
}

function TurnBanner({
  isOwner,
  ownerReady,
  ownerTeamName,
  teamName,
}: {
  isOwner: boolean;
  ownerReady: boolean;
  ownerTeamName: string | null;
  teamName: string;
}) {
  if (!ownerReady) {
    return (
      <div className="stage3-turn-banner stage3-turn-banner--wait">
        <p className="stage3-turn-banner__kicker">على المحك</p>
        <p className="stage3-turn-banner__title">بانتظار الميسّر</p>
        <p className="stage3-turn-banner__subtitle">سيُحدد فريق صاحب الدور قريباً.</p>
      </div>
    );
  }

  if (isOwner) {
    return (
      <div className="stage3-turn-banner stage3-turn-banner--owner">
        <p className="stage3-turn-banner__kicker">دوركم الآن!</p>
        <p className="stage3-turn-banner__title">اختاروا المجال والسؤال</p>
        <p className="stage3-turn-banner__subtitle">
          فريقكم: <span className="font-black text-[#4F8A10]">{teamName}</span>
        </p>
      </div>
    );
  }

  return (
    <div className="stage3-turn-banner stage3-turn-banner--wait">
      <p className="stage3-turn-banner__kicker">على المحك</p>
      <p className="stage3-turn-banner__title">
        بانتظار اختيار فريق{" "}
        <span className="text-[#2388C4]">{ownerTeamName ?? "صاحب الدور"}</span>
      </p>
      <p className="stage3-turn-banner__subtitle">ستُفتح الأسئلة عندما يختار الفريق صاحب الدور.</p>
    </div>
  );
}
