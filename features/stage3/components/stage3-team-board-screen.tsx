"use client";

import { useState } from "react";
import { ErrorState } from "@/components/layout/state-view";
import { useAuthRole } from "@/hooks/use-auth-role";
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
  const { user } = useAuthRole();
  const { teamName, error } = useTeamStage3Context();
  const teamId = user?.uid ?? null;
  const [selectingQuestionId, setSelectingQuestionId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  if (error) {
    return <ErrorState title="تعذر تحميل بيانات الفريق" description={error} />;
  }

  const isOwner = Boolean(teamId && ownerTeamId && teamId === ownerTeamId);
  const ownerReady = Boolean(ownerTeamId);

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
        callerTeamName: teamName || "فريق",
      });
    } catch {
      setActionError("تعذر فتح السؤال. تأكد أنك فريق صاحب الدور وأن السؤال لم يُستخدم.");
    } finally {
      setSelectingQuestionId(null);
    }
  }

  return (
    <div className="gameplay-scene gameplay-scene--centered stage3-scene stage3-scene--board">
      <div className="gameplay-flow">
        <Stage3SelectionTimeoutBanner notice={selectionTimeoutNotice} />

        <section className="gameplay-board-card stage3-unified-card stage3-unified-card--glass stage3-board-unified">
          <header className="stage3-board-hero">
            <TurnBanner
              isOwner={isOwner}
              ownerReady={ownerReady}
              ownerTeamName={ownerTeamName}
            />
          </header>

          {actionError ? <ErrorState title="تعذر المتابعة" description={actionError} /> : null}

          <Stage3Board
            embedded
            featured
            hideHeader
            variant="team"
            canChoose={isOwner}
            pendingQuestionId={selectingQuestionId}
            openedQuestionIds={openedQuestionIds}
            usedQuestionIds={usedQuestionIds}
            ownerTeamName={ownerTeamName}
            onSelectQuestion={(question, fieldLabel) => {
              void handleSelectQuestion(question, fieldLabel);
            }}
          />

        </section>
      </div>
    </div>
  );
}

function TurnBanner({
  isOwner,
  ownerReady,
  ownerTeamName,
}: {
  isOwner: boolean;
  ownerReady: boolean;
  ownerTeamName: string | null;
}) {
  if (!ownerReady) {
    return (
      <div className="stage3-turn-banner stage3-turn-banner--wait stage3-turn-banner--hero">
        <p className="stage3-turn-banner__kicker">على المحك</p>
        <p className="stage3-turn-banner__title">بانتظار الميسّر</p>
        <p className="stage3-turn-banner__subtitle">سيُحدد فريق صاحب الدور قريباً.</p>
      </div>
    );
  }

  if (isOwner) {
    return (
      <div className="stage3-turn-banner stage3-turn-banner--owner stage3-turn-banner--hero">
        <p className="stage3-turn-banner__kicker">دوركم الآن!</p>
        <p className="stage3-turn-banner__title">اختاروا المجال والسؤال</p>
      </div>
    );
  }

  return (
    <div className="stage3-turn-banner stage3-turn-banner--wait stage3-turn-banner--hero">
      <p className="stage3-turn-banner__kicker">على المحك</p>
      <p className="stage3-turn-banner__title">
        بانتظار اختيار فريق{" "}
        <span className="font-black text-[#0f5f8f]">{ownerTeamName ?? "صاحب الدور"}</span>
      </p>
      <p className="stage3-turn-banner__subtitle">ستُفتح الأسئلة عندما يختار الفريق صاحب الدور.</p>
    </div>
  );
}
