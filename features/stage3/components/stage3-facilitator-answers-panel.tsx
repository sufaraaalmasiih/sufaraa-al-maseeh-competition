"use client";

import { EmptyState } from "@/components/layout/empty-state";
import { ErrorState, LoadingState } from "@/components/layout/state-view";
import { useStage3ActiveAnswers } from "@/features/stage3/use-stage3-active-answers";

interface Stage3FacilitatorAnswersPanelProps {
  questionId: string | null;
}

export function Stage3FacilitatorAnswersPanel({
  questionId,
}: Stage3FacilitatorAnswersPanelProps) {
  const { answers, loading, error } = useStage3ActiveAnswers(questionId);

  return (
    <div className="glass-card-premium px-5 py-5 sm:px-6">
      <p className="text-center text-lg font-black text-[#143A5A]">حالة إجابات الفرق</p>
      <p className="mt-1 text-center text-sm text-[#143A5A]/65">
        معاينة الميسّر — تظهر قبل الجمهور.
      </p>

      <div className="mt-4">
        {loading ? <LoadingState variant="inline" /> : null}
        {error ? <ErrorState title="تعذر تحميل الإجابات" description={error} /> : null}
        {!loading && !error && answers.length === 0 ? (
          <EmptyState title="لا توجد إجابات مؤكدة بعد." />
        ) : null}
        {!loading && !error && answers.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {answers.map((row) => (
              <div key={row.answerDocId} className="stage3-team-answer-status">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-black text-[#143A5A]">{row.teamName}</p>
                  <span className="rounded-full bg-[#E9F6FC] px-2 py-0.5 text-xs font-bold text-[#2388C4]">
                    {row.isOwner ? "صاحب الدور" : "فريق آخر"}
                  </span>
                </div>
                <p className="mt-2 text-sm font-semibold text-[#143A5A]/80">
                  {row.passed ? "تجاوز" : row.answer || "—"}
                </p>
                <p className="mt-1 text-xs font-bold text-[#143A5A]/60">
                  {row.passed
                    ? "0 نقطة"
                    : `${row.isCorrect ? "صحيحة" : "خاطئة"} · ${row.pointsDelta >= 0 ? "+" : ""}${row.pointsDelta}`}
                </p>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

