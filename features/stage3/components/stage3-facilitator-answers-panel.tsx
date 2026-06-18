"use client";

import { EmptyState } from "@/components/layout/empty-state";
import { ErrorState, LoadingState } from "@/components/layout/state-view";
import { useStage3ActiveAnswers } from "@/features/stage3/use-stage3-active-answers";

interface Stage3FacilitatorAnswersPanelProps {
  questionId: string | null;
  correctAnswer?: string | null;
}

export function Stage3FacilitatorAnswersPanel({
  questionId,
  correctAnswer,
}: Stage3FacilitatorAnswersPanelProps) {
  const { answers, loading, error } = useStage3ActiveAnswers(questionId);

  return (
    <div className="stage3-facilitator-answers-panel">
      <div className="stage3-facilitator-answers-panel__head">
        <p className="stage3-facilitator-answers-panel__title">حالة إجابات الفرق</p>
        <p className="stage3-facilitator-answers-panel__subtitle">
          معاينة الميسّر — تظهر قبل الجمهور
        </p>
        {correctAnswer ? (
          <p className="stage3-facilitator-answers-panel__correct">
            <span>الإجابة الصحيحة:</span> {correctAnswer}
          </p>
        ) : null}
      </div>

      <div className="stage3-facilitator-answers-panel__body">
        {loading ? <LoadingState variant="inline" /> : null}
        {error ? <ErrorState title="تعذر تحميل الإجابات" description={error} /> : null}
        {!loading && !error && answers.length === 0 ? (
          <EmptyState title="لا توجد إجابات مؤكدة بعد." />
        ) : null}
        {!loading && !error && answers.length > 0 ? (
          <div className="stage3-facilitator-answers-panel__grid">
            {answers.map((row) => (
              <div key={row.answerDocId} className="stage3-team-answer-status">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-black text-[#143A5A]">{row.teamName}</p>
                  <span
                    className={
                      row.isOwner
                        ? "stage3-team-answer-status__badge stage3-team-answer-status__badge--owner"
                        : "stage3-team-answer-status__badge"
                    }
                  >
                    {row.isOwner ? "صاحب الدور" : "فريق آخر"}
                  </span>
                </div>
                <p className="stage3-team-answer-status__answer">
                  <span className="stage3-team-answer-status__label">إجابة الفريق:</span>{" "}
                  {row.passed ? "تجاوز" : row.answer || "—"}
                </p>
                {correctAnswer && !row.passed ? (
                  <p className="stage3-team-answer-status__correct">
                    <span className="stage3-team-answer-status__label">الإجابة الصحيحة:</span>{" "}
                    {correctAnswer}
                  </p>
                ) : null}
                <p
                  className={
                    row.passed
                      ? "stage3-team-answer-status__result"
                      : row.isCorrect
                        ? "stage3-team-answer-status__result stage3-team-answer-status__result--ok"
                        : "stage3-team-answer-status__result stage3-team-answer-status__result--bad"
                  }
                >
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
