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
import { STAGE3_SELECTION_TIMEOUT_PENALTY } from "@/features/stage3/stage3-official-constants";
import { useStage3MyAnswer } from "@/features/stage3/use-stage3-my-answer";
import type { Stage3QuestionMetadata } from "@/features/stage3/stage3-question-types";

interface Stage3TeamRevealScreenProps {
  question: Stage3QuestionMetadata | null;
  ownerTeamName?: string | null;
}

export function Stage3TeamRevealScreen({
  question,
  ownerTeamName = null,
}: Stage3TeamRevealScreenProps) {
  const { answerState, loading } = useStage3MyAnswer(question?.id ?? null);
  const mockQuestion = question ? getStage3MockQuestion(question.id) : null;
  const isSelectionTimeout = isStage3SelectionTimeoutQuestion(question);
  const penaltyPoints = Math.abs(STAGE3_SELECTION_TIMEOUT_PENALTY);

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
              <p className="mt-1 text-sm font-semibold text-[#143A5A]/80">
                ينتقل الدور إلى الفريق التالي
              </p>
            </div>
          ) : null}

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

