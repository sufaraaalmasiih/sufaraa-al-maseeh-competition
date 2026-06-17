"use client";

import { LoadingState } from "@/components/layout/state-view";
import { RevealResultChip } from "@/components/motion/reveal-result-chip";
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
    <div className="gameplay-scene gameplay-scene--centered stage3-scene stage3-scene--reveal">
      <div className="gameplay-flow">
        <section className="gameplay-board-card stage3-unified-card stage3-unified-card--glass">
          <Stage3RevealSummary question={question} embedded />

          <div className="stage3-answer-zone">
            <p className="mb-4 text-center text-xl font-black text-[#143A5A]">نتيجتك</p>
            {loading ? <LoadingState variant="inline" /> : null}
            {!loading && !answerState?.confirmed ? (
              <p className="rounded-xl border border-white/60 bg-white/30 px-4 py-4 text-center text-sm font-semibold text-[#143A5A]/75 backdrop-blur-md">
                لم تُسجَّل إجابة مؤكدة — 0 نقطة
              </p>
            ) : null}
            {!loading && answerState?.confirmed ? (
              <div className={`stage3-reveal-chips__grid ${isSelectionTimeout ? "stage3-reveal-chips__grid--timeout" : ""}`}>
                <RevealResultChip
                  label="إجابتك"
                  value={formatStage3RevealAnswerDisplay(
                    answerState.answer,
                    answerState.passed,
                    answerState.outcome,
                  )}
                  index={0}
                  className="stage3-facilitator-status-card text-center"
                  labelClassName="text-xs font-bold text-[#143A5A]/60"
                  valueClassName="mt-1 text-lg font-black text-[#143A5A]"
                />
                {!isSelectionTimeout ? (
                  <RevealResultChip
                    label="الإجابة الصحيحة"
                    value={mockQuestion?.correctAnswer ?? "—"}
                    index={1}
                    className="stage3-facilitator-status-card text-center stage3-reveal-chip--correct"
                    labelClassName="text-xs font-bold text-[#4F8A10]"
                    valueClassName="mt-1 text-lg font-black text-[#4F8A10]"
                  />
                ) : null}
                <RevealResultChip
                  label="النتيجة"
                  value={formatStage3RevealOutcome(answerState)}
                  index={isSelectionTimeout ? 1 : 2}
                  className="stage3-facilitator-status-card text-center"
                  labelClassName="text-xs font-bold text-[#143A5A]/60"
                  valueClassName="mt-1 text-lg font-black text-[#143A5A]"
                />
                <RevealResultChip
                  label="النقاط"
                  value={formatStage3PointsDelta(answerState.pointsDelta)}
                  index={isSelectionTimeout ? 2 : 3}
                  highlight
                  className="stage3-facilitator-status-card text-center"
                  labelClassName="text-xs font-bold text-[#143A5A]/60"
                  valueClassName="mt-1 text-lg font-black text-[#143A5A]"
                  highlightClassName="text-3xl text-[#2388C4]"
                />
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}

