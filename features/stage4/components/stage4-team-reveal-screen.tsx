"use client";

import { useGameFlow } from "@/features/gameflow/use-game-flow";
import { Stage4QuestionDisplay } from "@/features/stage4/components/stage4-question-display";
import { Stage4RevealResultsTable } from "@/features/stage4/components/stage4-reveal-results-table";
import { getStage4MockQuestion } from "@/features/stage4/stage4-mock-questions";
import { useStage4ActiveAnswers } from "@/features/stage4/use-stage4-active-answers";
import { useStage4MyAnswer } from "@/features/stage4/use-stage4-my-answer";
import { useStage4Ranking } from "@/features/stage4/use-stage4-ranking";

export function Stage4TeamRevealScreen() {
  const { stage4ActiveQuestion, stage4QuestionIndex, stage4QuestionCount } = useGameFlow();
  const { answers, loading } = useStage4ActiveAnswers(stage4ActiveQuestion?.id ?? null);
  const { teamId } = useStage4MyAnswer(stage4ActiveQuestion?.id ?? null);
  const { teams } = useStage4Ranking();

  const mockQuestion = stage4ActiveQuestion
    ? getStage4MockQuestion(stage4ActiveQuestion.id)
    : null;
  const myTeam = teams.find((team) => team.teamId === teamId);

  return (
    <div className="space-y-4">
      <Stage4QuestionDisplay
        question={stage4ActiveQuestion}
        questionIndex={stage4QuestionIndex}
        questionCount={stage4QuestionCount}
        variant="team"
      />

      <Stage4RevealResultsTable
        answers={answers}
        correctAnswer={
          mockQuestion?.correctAnswer ?? stage4ActiveQuestion?.correctAnswer ?? "—"
        }
        loading={loading}
        variant="team"
        highlightTeamId={teamId}
      />

      {myTeam ? (
        <div className="glass-card-premium grid gap-3 p-5 sm:grid-cols-2">
          <div>
            <p className="text-xs font-bold text-muted-foreground">نقاط المرحلة الرابعة</p>
            <p className="text-2xl font-black text-[#143A5A]">{myTeam.stage4Score}</p>
          </div>
          <div>
            <p className="text-xs font-bold text-muted-foreground">التسلسل الحالي</p>
            <p className="text-2xl font-black text-[#2388C4]">{myTeam.streak}</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
