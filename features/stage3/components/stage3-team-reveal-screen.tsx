"use client";

import { LoadingState } from "@/components/layout/state-view";
import { Stage3RevealSummary } from "@/features/stage3/components/stage3-reveal-summary";
import {
  formatStage3PointsDelta,
  formatStage3RevealAnswerDisplay,
  formatStage3RevealOutcome,
} from "@/features/stage3/stage3-reveal-outcome";
import { getStage3MockQuestion } from "@/features/stage3/stage3-mock-questions";
import { isStage3SelectionTimeoutQuestion } from "@/features/stage3/stage3-selection-timeout-question";
import { useStage3MyAnswer } from "@/features/stage3/use-stage3-my-answer";
import type { Stage3QuestionMetadata } from "@/features/stage3/stage3-question-types";

interface Stage3TeamRevealScreenProps {
  question: Stage3QuestionMetadata | null;
}

export function Stage3TeamRevealScreen({ question }: Stage3TeamRevealScreenProps) {
  const { answerState, loading } = useStage3MyAnswer(question?.id ?? null);
  const mockQuestion = question ? getStage3MockQuestion(question.id) : null;
  const isSelectionTimeout = isStage3SelectionTimeoutQuestion(question);

  return (
    <div className="stage3-scene">
      <Stage3RevealSummary question={question} />

      <div className="stage3-answer-zone">
        <p className="mb-4 text-center text-xl font-black text-[#143A5A]">نتيجتك</p>
        {loading ? <LoadingState /> : null}
        {!loading && !answerState?.confirmed ? (
          <p className="rounded-xl border border-[#2388C4]/20 bg-[#E9F6FC]/60 px-4 py-4 text-center text-sm font-semibold text-[#143A5A]/75">
            لم تُسجَّل إجابة مؤكدة — 0 نقطة
          </p>
        ) : null}
        {!loading && answerState?.confirmed ? (
          <div className={`grid gap-3 ${isSelectionTimeout ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
            <ResultChip
              label="إجابتك"
              value={formatStage3RevealAnswerDisplay(
                answerState.answer,
                answerState.passed,
                answerState.outcome,
              )}
            />
            {!isSelectionTimeout ? (
              <ResultChip label="الإجابة الصحيحة" value={mockQuestion?.correctAnswer ?? "—"} />
            ) : null}
            <ResultChip label="النتيجة" value={formatStage3RevealOutcome(answerState)} />
            <ResultChip
              label="النقاط"
              value={formatStage3PointsDelta(answerState.pointsDelta)}
              highlight
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}

function ResultChip({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="stage3-facilitator-status-card text-center">
      <p className="text-xs font-bold text-[#143A5A]/60">{label}</p>
      <p
        className={`mt-1 font-black ${highlight ? "text-3xl text-[#2388C4]" : "text-lg text-[#143A5A]"}`}
      >
        {value}
      </p>
    </div>
  );
}

