"use client";

import { EmptyState } from "@/components/layout/empty-state";
import { ErrorState, LoadingState } from "@/components/layout/state-view";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  formatStage3PointsDelta,
  formatStage3RevealAnswerDisplay,
  formatStage3RevealOutcome,
} from "@/features/stage3/stage3-reveal-outcome";
import type { Stage3ActiveAnswerRow } from "@/features/stage3/use-stage3-active-answers";

interface Stage3RevealResultsTableProps {
  answers: Stage3ActiveAnswerRow[];
  loading: boolean;
  error: string | null;
}

export function Stage3RevealResultsTable({
  answers,
  loading,
  error,
}: Stage3RevealResultsTableProps) {
  const confirmedAnswers = answers.filter((row) => row.confirmed);

  return (
    <Card>
      <CardHeader>
        <CardTitle>نتائج الفرق</CardTitle>
        <CardDescription>
          القيم من مستندات الإجابة المخزّنة — لا يُعاد حساب النقاط.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? <LoadingState /> : null}
        {error ? <ErrorState title="تعذر تحميل النتائج" description={error} /> : null}
        {!loading && !error && confirmedAnswers.length === 0 ? (
          <EmptyState title="لا توجد إجابات مؤكدة لهذا السؤال." />
        ) : null}
        {!loading && !error && confirmedAnswers.length > 0 ? (
          <div className="overflow-x-auto rounded-md border border-primary/10">
            <table className="w-full min-w-[720px] text-right text-sm">
              <thead className="bg-[#F3FAFF] text-[#143A5A]">
                <tr>
                  <th className="px-4 py-3 font-bold">الفريق</th>
                  <th className="px-4 py-3 font-bold">الإجابة</th>
                  <th className="px-4 py-3 font-bold">النتيجة</th>
                  <th className="px-4 py-3 font-bold">النقاط</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary/10 bg-white">
                {confirmedAnswers.map((row) => (
                  <tr key={row.answerDocId}>
                    <td className="px-4 py-3 font-bold text-[#143A5A]">{row.teamName}</td>
                    <td className="px-4 py-3">
                      {formatStage3RevealAnswerDisplay(row.answer, row.passed, row.outcome)}
                    </td>
                    <td className="px-4 py-3">
                      {formatStage3RevealOutcome(row)}
                    </td>
                    <td className="px-4 py-3 font-extrabold text-primary">
                      {formatStage3PointsDelta(row.pointsDelta)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
