"use client";

import { mergeNoAnswerRows } from "@/features/competition/merge-no-answer-rows";
import { Stage3RevealSummary } from "@/features/stage3/components/stage3-reveal-summary";
import { formatStage3RevealAnswerDisplay } from "@/features/stage3/stage3-reveal-outcome";
import { getStage3MockQuestion } from "@/features/stage3/stage3-mock-questions";
import { isStage3SelectionTimeoutQuestion } from "@/features/stage3/stage3-selection-timeout-question";
import { STAGE3_SELECTION_TIMEOUT_PENALTY } from "@/features/stage3/stage3-official-constants";
import { useStage3ActiveAnswers } from "@/features/stage3/use-stage3-active-answers";
import { useStage3MyAnswer } from "@/features/stage3/use-stage3-my-answer";
import { useStage3Ranking } from "@/features/stage3/use-stage3-ranking";
import type { Stage3ActiveAnswerRow } from "@/features/stage3/use-stage3-active-answers";
import type { Stage3QuestionMetadata } from "@/features/stage3/stage3-question-types";
import { Stage4RevealResultsTable } from "@/features/stage4/components/stage4-reveal-results-table";
import type { RevealResultsAnswerRow } from "@/features/stage4/reveal-results-answer-row";

interface Stage3TeamRevealScreenProps {
  question: Stage3QuestionMetadata | null;
  ownerTeamName?: string | null;
}

function mapStage3AnswersToRevealRows(answers: Stage3ActiveAnswerRow[]): RevealResultsAnswerRow[] {
  return answers
    .filter((row) => row.confirmed)
    .map((row) => ({
      answerDocId: row.answerDocId,
      teamId: row.teamId,
      teamName: row.teamName,
      answerText: formatStage3RevealAnswerDisplay(row.answer, row.passed, row.outcome),
      passed: row.passed,
      confirmed: row.confirmed,
      isCorrect: row.isCorrect,
      pointsDelta: row.pointsDelta,
      streakBefore: 0,
      streakAfter: 0,
      outcome: row.outcome,
    }));
}

export function Stage3TeamRevealScreen({
  question,
  ownerTeamName = null,
}: Stage3TeamRevealScreenProps) {
  const { answers, loading } = useStage3ActiveAnswers(question?.id ?? null);
  const { teams: rankingTeams } = useStage3Ranking();
  const { teamId } = useStage3MyAnswer(question?.id ?? null);
  const mockQuestion = question ? getStage3MockQuestion(question.id) : null;
  const isSelectionTimeout = isStage3SelectionTimeoutQuestion(question);
  const penaltyPoints = Math.abs(STAGE3_SELECTION_TIMEOUT_PENALTY);
  const revealRows = mergeNoAnswerRows(mapStage3AnswersToRevealRows(answers), rankingTeams);

  return (
    <div className="gameplay-scene gameplay-scene--centered stage3-scene stage3-scene--reveal">
      <div className="gameplay-flow">
        <section className="gameplay-board-card stage3-unified-card stage3-unified-card--glass">
          {isSelectionTimeout ? (
            <div
              className="glass-card-premium mb-4 border border-[#143A5A]/20 bg-[#FFF8E8]/90 px-5 py-4 text-center"
              role="status"
              aria-live="polite"
            >
              <p className="text-base font-black text-[#143A5A]">
                انتهى وقت اختيار السؤال — لم يختر فريق{" "}
                <span className="text-[#2388C4]">{ownerTeamName ?? "صاحب الدور"}</span>{" "}
                سؤالاً في الوقت المحدد
              </p>
              <p className="mt-2 text-sm font-bold text-[#B45309]">
                خصم {penaltyPoints} نقاط على صاحب الدور
              </p>
            </div>
          ) : null}

          <Stage3RevealSummary question={question} embedded />

          <div className="stage3-answer-zone">
            <p className="mb-4 text-center text-xl font-black text-[#143A5A]">إجابات كل الفرق</p>
            <Stage4RevealResultsTable
              answers={revealRows}
              correctAnswer={isSelectionTimeout ? "—" : mockQuestion?.correctAnswer ?? "—"}
              loading={loading}
              variant="team"
              highlightTeamId={teamId}
              embedded
              revealStage="stage3"
              animate
            />
          </div>
        </section>
      </div>
    </div>
  );
}
