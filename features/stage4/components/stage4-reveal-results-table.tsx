"use client";

import { LoadingState } from "@/components/layout/state-view";
import type { Stage4ActiveAnswerRow } from "@/features/stage4/use-stage4-active-answers";

interface Stage4RevealResultsTableProps {
  answers: Stage4ActiveAnswerRow[];
  correctAnswer: string;
  loading?: boolean;
  variant?: "team" | "facilitator" | "audience";
  highlightTeamId?: string | null;
}

function outcomeLabel(answer: Stage4ActiveAnswerRow): string {
  if (answer.passed) {
    return "تخطي";
  }

  return answer.isCorrect ? "صحيح" : "خطأ";
}

export function Stage4RevealResultsTable({
  answers,
  correctAnswer,
  loading = false,
  variant = "facilitator",
  highlightTeamId,
}: Stage4RevealResultsTableProps) {
  if (loading) {
    return <LoadingState />;
  }

  const visibleAnswers =
    variant === "team" && highlightTeamId
      ? answers.filter((answer) => answer.teamId === highlightTeamId)
      : answers;

  return (
    <div className="space-y-4">
      <div className="rounded-md border border-[#4F8A10]/20 bg-[#F1F9E8] px-4 py-3 text-center">
        <p className="text-xs font-bold text-muted-foreground">الإجابة الصحيحة</p>
        <p className="mt-1 text-lg font-black text-[#143A5A]">{correctAnswer}</p>
      </div>

      <div className="overflow-x-auto rounded-md border border-primary/10">
        <table className="w-full min-w-[640px] text-right text-sm">
          <thead className="bg-[#F3FAFF] text-[#143A5A]">
            <tr>
              {variant !== "team" ? <th className="px-4 py-3 font-bold">الفريق</th> : null}
              <th className="px-4 py-3 font-bold">الإجابة</th>
              <th className="px-4 py-3 font-bold">الحالة</th>
              <th className="px-4 py-3 font-bold">النقاط</th>
              <th className="px-4 py-3 font-bold">التسلسل</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-primary/10 bg-white">
            {visibleAnswers.length === 0 ? (
              <tr>
                <td
                  colSpan={variant === "team" ? 4 : 5}
                  className="px-4 py-6 text-center text-muted-foreground"
                >
                  لا توجد إجابات بعد.
                </td>
              </tr>
            ) : (
              visibleAnswers.map((answer) => (
                <tr
                  key={answer.answerDocId}
                  className={
                    highlightTeamId && answer.teamId === highlightTeamId
                      ? "bg-[#F3FAFF]/70"
                      : undefined
                  }
                >
                  {variant !== "team" ? (
                    <td className="px-4 py-3 font-bold text-[#143A5A]">{answer.teamName}</td>
                  ) : null}
                  <td className="px-4 py-3">
                    {answer.passed ? "تخطي" : answer.answerText || "—"}
                  </td>
                  <td className="px-4 py-3">{outcomeLabel(answer)}</td>
                  <td className="px-4 py-3 font-bold">{answer.pointsDelta}</td>
                  <td className="px-4 py-3">{answer.streakAfter}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
