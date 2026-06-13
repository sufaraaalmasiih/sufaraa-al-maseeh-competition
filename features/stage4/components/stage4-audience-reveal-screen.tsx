"use client";

import { useGameFlow } from "@/features/gameflow/use-game-flow";
import { Stage4RevealResultsTable } from "@/features/stage4/components/stage4-reveal-results-table";
import { getStage4MockQuestion } from "@/features/stage4/stage4-mock-questions";
import { useStage4ActiveAnswers } from "@/features/stage4/use-stage4-active-answers";

export function Stage4AudienceRevealScreen() {
  const { stage4ActiveQuestion } = useGameFlow();
  const { answers, loading } = useStage4ActiveAnswers(stage4ActiveQuestion?.id ?? null);
  const mockQuestion = stage4ActiveQuestion
    ? getStage4MockQuestion(stage4ActiveQuestion.id)
    : null;

  return (
    <Stage4RevealResultsTable
      answers={answers}
      correctAnswer={
        mockQuestion?.correctAnswer ?? stage4ActiveQuestion?.correctAnswer ?? "—"
      }
      loading={loading}
      variant="audience"
    />
  );
}
