"use client";

import { TimerCountdown } from "@/features/gameflow/components/timer-countdown";
import { useCompetitionTimer } from "@/features/gameflow/use-competition-timer";
import { Stage3Board } from "@/features/stage3/components/stage3-board";
import { Stage3SelectionTimeoutBanner } from "@/features/stage3/components/stage3-selection-timeout-banner";
import type { Stage3SelectionTimeoutNotice } from "@/features/stage3/stage3-selection-timeout-notice";

interface Stage3AudienceBoardScreenProps {
  openedQuestionIds: string[];
  usedQuestionIds: string[];
  ownerTeamName: string | null;
  selectionTimeoutNotice: Stage3SelectionTimeoutNotice | null;
}

export function Stage3AudienceBoardScreen({
  openedQuestionIds,
  usedQuestionIds,
  ownerTeamName,
  selectionTimeoutNotice,
}: Stage3AudienceBoardScreenProps) {
  const { timer, remainingSeconds, isExpired } = useCompetitionTimer();
  const isSelectionTimer =
    timer?.active && timer.stage === "stage3" && timer.purpose === "selection";

  return (
    <div className="stage3-scene">
      <Stage3SelectionTimeoutBanner notice={selectionTimeoutNotice} />
      <div className="stage3-turn-banner stage3-turn-banner--wait">
        <p className="stage3-turn-banner__kicker">على المحك</p>
        <p className="stage3-turn-banner__title">لوحة العرض</p>
        <p className="stage3-turn-banner__subtitle">
          {ownerTeamName
            ? `بانتظار اختيار فريق ${ownerTeamName}`
            : "بانتظار تحديد فريق صاحب الدور"}
        </p>
      </div>

      {isSelectionTimer ? (
        <TimerCountdown
          remainingSeconds={remainingSeconds}
          isExpired={isExpired}
          label="وقت اختيار السؤال"
        />
      ) : null}

      <Stage3Board        variant="audience"
        openedQuestionIds={openedQuestionIds}
        usedQuestionIds={usedQuestionIds}
        ownerTeamName={ownerTeamName}
      />
    </div>
  );
}

