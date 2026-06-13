"use client";

import { useState } from "react";
import { ErrorState } from "@/components/layout/state-view";
import { Button } from "@/components/ui/button";
import { Stage3FacilitatorAnswersPanel } from "@/features/stage3/components/stage3-facilitator-answers-panel";
import { Stage3RevealSummary } from "@/features/stage3/components/stage3-reveal-summary";
import { returnToStage3Board } from "@/features/stage3/return-to-stage3-board";
import type { Stage3QuestionMetadata } from "@/features/stage3/stage3-question-types";

interface Stage3FacilitatorResultsPanelProps {
  question: Stage3QuestionMetadata | null;
  ownerTeamName: string | null;
}

export function Stage3FacilitatorResultsPanel({
  question,
  ownerTeamName,
}: Stage3FacilitatorResultsPanelProps) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleNextTurn() {
    setPending(true);
    setError(null);

    try {
      await returnToStage3Board();
    } catch {
      setError("تعذر الانتقال إلى الدور التالي.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="stage3-scene">
      {error ? <ErrorState title="تعذر المتابعة" description={error} /> : null}
      <Stage3RevealSummary question={question} ownerTeamName={ownerTeamName} />
      <Stage3FacilitatorAnswersPanel questionId={question?.id ?? null} />
      <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <Button
          type="button"
          disabled={pending}
          onClick={() => {
            void handleNextTurn();
          }}
        >
          {pending ? "جاري التحضير..." : "الدور التالي / العودة للوحة"}
        </Button>
      </div>
    </div>
  );
}

