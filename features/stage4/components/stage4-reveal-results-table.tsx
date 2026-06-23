"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { getRankingRowDelay } from "@/components/motion/animated-ranking-row";
import { LoadingState } from "@/components/layout/state-view";
import { RevealCorrectAnswer } from "@/components/motion/reveal-correct-answer";
import { RevealResultChip } from "@/components/motion/reveal-result-chip";
import { useGradualReveal } from "@/hooks/use-gradual-reveal";
import { getRevealResultsDensityClass } from "@/features/competition/reveal-results-density";
import {
  formatStage3PointsDelta,
  formatStage3RevealOutcome,
} from "@/features/stage3/stage3-reveal-outcome";
import { cn } from "@/lib/utils";
import type { RevealResultsAnswerRow } from "@/features/stage4/reveal-results-answer-row";

interface Stage4RevealResultsTableProps {
  answers: RevealResultsAnswerRow[];
  correctAnswer: string;
  loading?: boolean;
  variant?: "team" | "facilitator" | "audience";
  highlightTeamId?: string | null;
  animate?: boolean;
  embedded?: boolean;
  /** Stage 3 audience reveal hides the streak column and uses stage3 outcome labels. */
  revealStage?: "stage3" | "stage4";
  showStreakColumn?: boolean;
  outcomeHeader?: string;
  /** Optional section rendered below the answers table inside the same reveal card. */
  rankingSection?: ReactNode;
}

const TABLE_REVEAL_DELAY = 0.55;

function stage4OutcomeLabel(answer: RevealResultsAnswerRow): string {
  if (answer.passed) {
    return "تخطي";
  }

  if (answer.outcome === "no_answer") {
    return "لم يجيب";
  }

  return answer.isCorrect ? "صحيح" : "خطأ";
}

function stage4OutcomeClassName(answer: RevealResultsAnswerRow): string {
  if (answer.passed || answer.outcome === "no_answer") {
    return "reveal-results-outcome reveal-results-outcome--pass";
  }

  return answer.isCorrect
    ? "reveal-results-outcome reveal-results-outcome--correct"
    : "reveal-results-outcome reveal-results-outcome--wrong";
}

function stage3OutcomeClassName(answer: RevealResultsAnswerRow): string {
  if (answer.passed) {
    return "reveal-results-outcome reveal-results-outcome--pass";
  }

  if (answer.outcome === "selection_timeout") {
    return "reveal-results-outcome reveal-results-outcome--pass";
  }

  if (answer.outcome === "no_answer") {
    return "reveal-results-outcome reveal-results-outcome--wrong";
  }

  return answer.isCorrect
    ? "reveal-results-outcome reveal-results-outcome--correct"
    : "reveal-results-outcome reveal-results-outcome--wrong";
}

function pointsClassName(pointsDelta: number): string {
  if (pointsDelta > 0) {
    return "reveal-results-points reveal-results-points--gain";
  }

  if (pointsDelta < 0) {
    return "reveal-results-points reveal-results-points--loss";
  }

  return "reveal-results-points";
}

export function Stage4RevealResultsTable({
  answers,
  correctAnswer,
  loading = false,
  variant = "facilitator",
  highlightTeamId,
  animate = true,
  embedded = false,
  revealStage = "stage4",
  showStreakColumn,
  outcomeHeader,
  rankingSection,
}: Stage4RevealResultsTableProps) {
  const usesStage3Outcomes = revealStage === "stage3";
  const showStreak = showStreakColumn ?? !usesStage3Outcomes;
  const statusHeader = outcomeHeader ?? (usesStage3Outcomes ? "النتيجة" : "الحالة");

  const getOutcomeLabel = (answer: RevealResultsAnswerRow) =>
    usesStage3Outcomes
      ? formatStage3RevealOutcome({
          passed: answer.passed,
          isCorrect: answer.isCorrect,
          outcome: answer.outcome,
          pointsDelta: answer.pointsDelta,
        })
      : stage4OutcomeLabel(answer);

  const getOutcomeClass = (answer: RevealResultsAnswerRow) =>
    usesStage3Outcomes ? stage3OutcomeClassName(answer) : stage4OutcomeClassName(answer);

  const formatPoints = (pointsDelta: number) =>
    usesStage3Outcomes ? formatStage3PointsDelta(pointsDelta) : pointsDelta > 0 ? `+${pointsDelta}` : String(pointsDelta);
  const visibleAnswers =
    variant === "team" && highlightTeamId
      ? answers.filter((answer) => answer.teamId === highlightTeamId)
      : answers;
  const showTeamColumn = variant !== "team";
  const showTeamChips = variant === "team" && embedded;

  // الميسّر: إعلان تدريجي. الجمهور والفرق: فوري (ما عدا تحريك البطاقات في شاشة الفريق).
  const gradualEnabled = animate && variant === "facilitator";
  const teamGradualEnabled = animate && variant === "team";
  const revealBatchSize =
    visibleAnswers.length > 0 && visibleAnswers.length <= 8 ? visibleAnswers.length : 1;
  const revealInterval = gradualEnabled
    ? visibleAnswers.length <= 8
      ? 280
      : 520
    : teamGradualEnabled
      ? 520
      : 0;

  const revealedAnswers = useGradualReveal(visibleAnswers, revealInterval, {
    maxDurationMs: visibleAnswers.length <= 8 ? 2_400 : 8_000,
    batchSize: revealBatchSize,
  });
  const rows = gradualEnabled || teamGradualEnabled ? revealedAnswers : visibleAnswers;
  const latestAnswer = rows[rows.length - 1] ?? null;

  if (loading && variant !== "audience") {
    return <LoadingState variant={embedded ? "inline" : "page"} />;
  }

  const densityClass =
    variant === "audience" && !embedded
      ? getRevealResultsDensityClass(visibleAnswers.length)
      : null;

  const shellClass = cn(
    embedded ? "stage4-reveal-results" : "reveal-results-card reveal-results-card--standalone",
    !embedded && variant === "audience" && "reveal-results-card--audience reveal-results-card--glass",
    !embedded && rankingSection && "reveal-results-card--with-ranking",
    densityClass,
  );

  const content = (
    <>
      <RevealCorrectAnswer
        label="الإجابة الصحيحة"
        value={correctAnswer}
        className={embedded ? "stage4-reveal-answer-hero" : "reveal-results-card__answer"}
        labelClassName={
          embedded ? "stage4-reveal-answer-hero__label" : "reveal-results-card__answer-label"
        }
        valueClassName={
          embedded ? "stage4-reveal-answer-hero__value" : "reveal-results-card__answer-value"
        }
      />

      {gradualEnabled && animate && rows.length < visibleAnswers.length ? (
        <motion.p
          className="reveal-results-card__progress reveal-progress-label"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          key={rows.length}
        >
          جاري الإعلان... ({rows.length}/{visibleAnswers.length})
        </motion.p>
      ) : null}

      {showTeamChips ? (
        <div className="stage4-reveal-chips">
          <p className="stage4-reveal-chips__title">نتيجتك</p>
          {!latestAnswer ? (
            <p className="stage4-reveal-chips__empty">لم تُسجَّل إجابة بعد.</p>
          ) : (
            <div className="stage4-reveal-chips__grid">
              <RevealResultChip
                label="إجابتك"
                value={latestAnswer.passed ? "تخطي" : latestAnswer.answerText || "—"}
                index={0}
                className="stage4-reveal-chip"
                labelClassName="stage4-reveal-chip__label"
                valueClassName="stage4-reveal-chip__value"
              />
              <RevealResultChip
                label={statusHeader}
                value={getOutcomeLabel(latestAnswer)}
                index={1}
                className="stage4-reveal-chip"
                labelClassName="stage4-reveal-chip__label"
                valueClassName="stage4-reveal-chip__value"
              />
              <RevealResultChip
                label="النقاط"
                value={formatPoints(latestAnswer.pointsDelta)}
                index={2}
                highlight
                className="stage4-reveal-chip"
                labelClassName="stage4-reveal-chip__label"
                valueClassName="stage4-reveal-chip__value"
                highlightClassName="stage4-reveal-chip__value--highlight"
              />
              {showStreak ? (
                <RevealResultChip
                  label="التسلسل"
                  value={String(latestAnswer.streakAfter)}
                  index={3}
                  className="stage4-reveal-chip"
                  labelClassName="stage4-reveal-chip__label"
                  valueClassName="stage4-reveal-chip__value"
                />
              ) : null}
            </div>
          )}
        </div>
      ) : (
        <motion.div
          className="reveal-results-card__table-wrap"
          initial={animate ? { opacity: 0, y: 16 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.45,
            delay: animate ? TABLE_REVEAL_DELAY : 0,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          <div className="competition-ranking-scroll reveal-results-card__scroll">
            <table className="competition-ranking-table competition-ranking-table--reveal">
              <thead>
                <tr>
                  {showTeamColumn ? <th>الفريق</th> : null}
                  <th>الإجابة</th>
                  <th>{statusHeader}</th>
                  <th>النقاط</th>
                  {showStreak ? <th>التسلسل</th> : null}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={showTeamColumn ? (showStreak ? 5 : 4) : showStreak ? 4 : 3}
                      className="reveal-results-card__empty"
                    >
                      جاري تحميل الإجابات...
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={showTeamColumn ? (showStreak ? 5 : 4) : showStreak ? 4 : 3}
                      className="reveal-results-card__empty"
                    >
                      لا توجد إجابات بعد.
                    </td>
                  </tr>
                ) : (
                  rows.map((answer, index) => (
                    <motion.tr
                      key={answer.answerDocId}
                      initial={
                        animate
                          ? { opacity: 0, x: 28, filter: "blur(3px)" }
                          : false
                      }
                      animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                      transition={{
                        duration: 0.42,
                        delay: animate ? TABLE_REVEAL_DELAY + getRankingRowDelay(index) : 0,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                      className={cn(
                        highlightTeamId && answer.teamId === highlightTeamId
                          ? "reveal-results-row--highlight"
                          : index === rows.length - 1 && animate
                            ? "reveal-results-row--latest"
                            : undefined,
                      )}
                    >
                      {showTeamColumn ? (
                        <td className="reveal-results-team">{answer.teamName}</td>
                      ) : null}
                      <td className="reveal-results-answer">
                        {answer.passed ? "تخطي" : answer.answerText || "—"}
                      </td>
                      <td>
                        <span className={getOutcomeClass(answer)}>
                          {getOutcomeLabel(answer)}
                        </span>
                      </td>
                      <td className={pointsClassName(answer.pointsDelta)}>
                        {formatPoints(answer.pointsDelta)}
                      </td>
                      {showStreak ? (
                        <td className="reveal-results-streak">{answer.streakAfter}</td>
                      ) : null}
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {rankingSection ? (
        <div className="reveal-results-card__ranking">{rankingSection}</div>
      ) : null}
    </>
  );

  if (embedded) {
    return <div className={shellClass}>{content}</div>;
  }

  return (
    <motion.div
      className={shellClass}
      initial={animate ? { opacity: 0, y: variant === "audience" ? 10 : 28, scale: 0.98 } : false}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 24, mass: 0.9 }}
    >
      {content}
    </motion.div>
  );
}
