"use client";

import { Stage3GameplayHeader } from "@/features/stage3/components/stage3-gameplay-header";
import { Stage3RankingTable } from "@/features/stage3/components/stage3-ranking-table";
import { getStage3MockQuestion } from "@/features/stage3/stage3-mock-questions";
import { STAGE3_SELECTION_TIMEOUT_PENALTY } from "@/features/stage3/stage3-official-constants";
import { isStage3SelectionTimeoutQuestion } from "@/features/stage3/stage3-selection-timeout-question";
import { formatStage3RevealAnswerDisplay } from "@/features/stage3/stage3-reveal-outcome";
import { mergeNoAnswerRows } from "@/features/competition/merge-no-answer-rows";
import type { RankedStage3Team } from "@/features/stage3/stage3-ranking";
import type { Stage3ActiveAnswerRow } from "@/features/stage3/use-stage3-active-answers";
import { useStage3ActiveAnswers } from "@/features/stage3/use-stage3-active-answers";
import type { Stage3QuestionMetadata } from "@/features/stage3/stage3-question-types";
import { Stage4RevealResultsTable } from "@/features/stage4/components/stage4-reveal-results-table";
import type { RevealResultsAnswerRow } from "@/features/stage4/reveal-results-answer-row";

interface Stage3AudienceRevealScreenProps {
  question: Stage3QuestionMetadata | null;
  ownerTeamName: string | null;
  rankingTeams: RankedStage3Team[];
  rankingLoading: boolean;
  rankingError: string | null;
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

export function Stage3AudienceRevealScreen({
  question,
  ownerTeamName,
  rankingTeams,
  rankingLoading,
  rankingError,
}: Stage3AudienceRevealScreenProps) {
  const { answers, loading } = useStage3ActiveAnswers(question?.id ?? null);
  const isSelectionTimeout = question ? isStage3SelectionTimeoutQuestion(question) : false;
  const mockQuestion = question ? getStage3MockQuestion(question.id) : null;
  // كل الفرق تظهر للجمهور: من لم يُجِب (لم يحضر دوره/تخطّى) يظهر كصف «لم يجيب» (#9/#10).
  const revealRows = mergeNoAnswerRows(mapStage3AnswersToRevealRows(answers), rankingTeams);

  if (isSelectionTimeout) {
    const penaltyPoints = Math.abs(STAGE3_SELECTION_TIMEOUT_PENALTY);

    return (
      <div className="audience-reveal-results-page audience-reveal-results-page--timeout audience-stage3-timeout-layout">
        <div className="audience-stage3-question-card audience-stage3-timeout-card">
          {question ? (
            <Stage3GameplayHeader
              ownerTeamName={ownerTeamName}
              fieldLabel={question.fieldLabel}
              questionNumber={question.questionNumber || undefined}
              difficulty={question.difficulty}
            />
          ) : null}

          <div className="audience-stage3-timeout-card__body">
            <div className="audience-stage3-timeout-card__announce">
              <span className="audience-stage3-timeout-card__badge">الإعلان</span>
              <p className="audience-stage3-timeout-card__subtitle">انتهى وقت اختيار السؤال</p>
              <h2 className="audience-stage3-timeout-card__headline">
                لم يُختر سؤال في الوقت المحدد
              </h2>
              <p className="audience-stage3-timeout-card__penalty">
                خصم {penaltyPoints} نقاط
                {ownerTeamName ? ` على ${ownerTeamName}` : " على صاحب الدور"}
              </p>
            </div>

            <div className="audience-stage3-timeout-card__ranking">
              <Stage3RankingTable
                teams={rankingTeams}
                loading={rankingLoading}
                error={rankingError}
                variant="audience"
                embedded
                animate
                revealAscending
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="audience-reveal-results-page">
      <Stage4RevealResultsTable
        answers={revealRows}
        correctAnswer={mockQuestion?.correctAnswer ?? "—"}
        loading={loading}
        variant="audience"
        revealStage="stage3"
        animate
        rankingSection={
          <Stage3RankingTable
            teams={rankingTeams}
            loading={rankingLoading}
            error={rankingError}
            variant="audience"
            embedded
            animate
            revealAscending
          />
        }
      />
    </div>
  );
}
