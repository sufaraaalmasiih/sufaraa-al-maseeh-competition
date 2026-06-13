"use client";

import { Stage3RevealResultsTable } from "@/features/stage3/components/stage3-reveal-results-table";
import { Stage3RevealSummary } from "@/features/stage3/components/stage3-reveal-summary";
import { useStage3ActiveAnswers } from "@/features/stage3/use-stage3-active-answers";
import type { Stage3QuestionMetadata } from "@/features/stage3/stage3-question-types";

interface Stage3AudienceRevealScreenProps {
  question: Stage3QuestionMetadata | null;
  ownerTeamName: string | null;
}

export function Stage3AudienceRevealScreen({
  question,
  ownerTeamName,
}: Stage3AudienceRevealScreenProps) {
  const { answers, loading, error } = useStage3ActiveAnswers(question?.id ?? null);

  return (
    <div className="space-y-4">
      <Stage3RevealSummary question={question} ownerTeamName={ownerTeamName} />
      <Stage3RevealResultsTable answers={answers} loading={loading} error={error} />
    </div>
  );
}
