"use client";

import { RevealResultChip } from "@/components/motion/reveal-result-chip";
import { useGameFlow } from "@/features/gameflow/use-game-flow";
import { Stage4QuestionDisplay } from "@/features/stage4/components/stage4-question-display";
import { Stage4RevealResultsTable } from "@/features/stage4/components/stage4-reveal-results-table";
import { STAGE4_NAME } from "@/features/stage4/stage4-constants";
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
  const questionLabel = `السؤال ${Math.min(stage4QuestionIndex + 1, stage4QuestionCount)} من ${stage4QuestionCount}`;

  return (
    <div className="gameplay-scene gameplay-scene--centered stage4-scene stage4-scene--reveal">
      <div className="gameplay-flow">
        <section className="gameplay-board-card stage4-unified-card stage4-unified-card--glass stage4-team-card stage4-reveal-card">
          <header className="stage4-status-top">
            <div className="stage4-question-top__meta">
              <div className="stage4-question-top__bar">
                <div className="stage4-question-top__lead">
                  <p className="stage4-question-top__label">{STAGE4_NAME}</p>
                  <p className="stage4-question-top__progress">{questionLabel}</p>
                </div>
                {stage4ActiveQuestion ? (
                  <span className="stage4-question-top__type-badge">
                    {stage4ActiveQuestion.prompt}
                  </span>
                ) : null}
              </div>
            </div>
          </header>

          <div className="stage4-reveal-body">
            <Stage4QuestionDisplay
              question={stage4ActiveQuestion}
              questionIndex={stage4QuestionIndex}
              questionCount={stage4QuestionCount}
              variant="team"
              embedded
              hideMeta
            />

            <div className="stage4-reveal-zone">
              <Stage4RevealResultsTable
                answers={answers}
                correctAnswer={
                  mockQuestion?.correctAnswer ?? stage4ActiveQuestion?.correctAnswer ?? "—"
                }
                loading={loading}
                variant="team"
                highlightTeamId={teamId}
                embedded
              />

              {myTeam ? (
                <div className="stage4-reveal-stats">
                  <RevealResultChip
                    label="نقاط المرحلة الرابعة"
                    value={String(myTeam.stage4Score)}
                    index={4}
                    className="stage4-reveal-chip"
                    labelClassName="stage4-reveal-chip__label"
                    valueClassName="stage4-reveal-chip__value"
                  />
                  <RevealResultChip
                    label="التسلسل الحالي"
                    value={String(myTeam.streak)}
                    index={5}
                    highlight
                    className="stage4-reveal-chip"
                    labelClassName="stage4-reveal-chip__label"
                    valueClassName="stage4-reveal-chip__value"
                    highlightClassName="stage4-reveal-chip__value--highlight"
                  />
                </div>
              ) : null}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
