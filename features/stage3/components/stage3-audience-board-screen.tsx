"use client";

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
  return (
    <div className="gameplay-scene gameplay-scene--centered stage3-scene stage3-scene--board">
      <div className="gameplay-flow">
        <Stage3SelectionTimeoutBanner notice={selectionTimeoutNotice} />

        <section className="gameplay-board-card stage3-unified-card stage3-unified-card--glass stage3-board-unified">
          <header className="stage3-board-hero">
            <div className="stage3-turn-banner stage3-turn-banner--wait stage3-turn-banner--hero">
              <p className="stage3-turn-banner__kicker">على المحك</p>
              <p className="stage3-turn-banner__title">لوحة العرض</p>
              <p className="stage3-turn-banner__subtitle">
                {ownerTeamName
                  ? `بانتظار اختيار فريق ${ownerTeamName}`
                  : "بانتظار تحديد فريق صاحب الدور"}
              </p>
            </div>
          </header>

          <Stage3Board
            embedded
            featured
            hideHeader
            variant="audience"
            openedQuestionIds={openedQuestionIds}
            usedQuestionIds={usedQuestionIds}
            ownerTeamName={ownerTeamName}
          />
        </section>
      </div>
    </div>
  );
}
