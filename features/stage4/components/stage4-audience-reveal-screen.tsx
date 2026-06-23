"use client";

import { useMemo } from "react";
import { useGameFlow } from "@/features/gameflow/use-game-flow";
import { mergeNoAnswerRows } from "@/features/competition/merge-no-answer-rows";
import { Stage4RevealResultsTable } from "@/features/stage4/components/stage4-reveal-results-table";
import { getStage4MockQuestion } from "@/features/stage4/stage4-mock-questions";
import { useStage4ActiveAnswers } from "@/features/stage4/use-stage4-active-answers";
import { useStage4Ranking } from "@/features/stage4/use-stage4-ranking";

export function Stage4AudienceRevealScreen() {
  const { stage4ActiveQuestion } = useGameFlow();
  const { answers, loading } = useStage4ActiveAnswers(stage4ActiveQuestion?.id ?? null);
  const { teams: rankingTeams } = useStage4Ranking();
  const mockQuestion = stage4ActiveQuestion
    ? getStage4MockQuestion(stage4ActiveQuestion.id)
    : null;
  const answersKey = answers.map((row) => row.answerDocId).join("|");
  const teamsKey = rankingTeams.map((team) => team.teamId).join("|");
  const mergedAnswers = useMemo(
    () => mergeNoAnswerRows(answers, rankingTeams),
    [answersKey, teamsKey, answers, rankingTeams],
  );

  return (
    <div className="audience-reveal-results-page">
      <Stage4RevealResultsTable
        answers={mergedAnswers}
        correctAnswer={
          mockQuestion?.correctAnswer ?? stage4ActiveQuestion?.correctAnswer ?? "—"
        }
        loading={loading}
        variant="audience"
        animate
      />
    </div>
  );
}
