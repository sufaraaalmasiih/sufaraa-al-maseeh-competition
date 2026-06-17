"use client";

import { motion } from "framer-motion";
import { EmptyState } from "@/components/layout/empty-state";
import { ErrorState, LoadingState } from "@/components/layout/state-view";
import { getRankingRowDelay } from "@/components/motion/animated-ranking-row";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useGradualReveal } from "@/hooks/use-gradual-reveal";
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
  animate?: boolean;
}

export function Stage3RevealResultsTable({
  answers,
  loading,
  error,
  animate = true,
}: Stage3RevealResultsTableProps) {
  const confirmedAnswers = answers.filter((row) => row.confirmed);
  const revealedAnswers = useGradualReveal(confirmedAnswers, animate ? 520 : 0, {
    maxDurationMs: 8_000,
  });
  const rows = animate ? revealedAnswers : confirmedAnswers;

  return (
    <Card className="reveal-results-card">
      <CardHeader>
        <CardTitle>نتائج الفرق</CardTitle>
        <CardDescription>
          {animate && rows.length < confirmedAnswers.length
            ? `جاري الإعلان... (${rows.length}/${confirmedAnswers.length})`
            : "القيم من مستندات الإجابة المخزّنة — لا يُعاد حساب النقاط."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? <LoadingState variant="inline" /> : null}
        {error ? <ErrorState title="تعذر تحميل النتائج" description={error} /> : null}
        {!loading && !error && confirmedAnswers.length === 0 ? (
          <EmptyState title="لا توجد إجابات مؤكدة لهذا السؤال." />
        ) : null}
        {!loading && !error && rows.length > 0 ? (
          <div className="competition-ranking-scroll">
            <table className="competition-ranking-table competition-ranking-table--reveal">
              <thead>
                <tr>
                  <th>الفريق</th>
                  <th>الإجابة</th>
                  <th>النتيجة</th>
                  <th>النقاط</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <motion.tr
                    key={row.answerDocId}
                    initial={animate ? { opacity: 0, y: 22, scale: 0.96 } : false}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{
                      type: "spring",
                      stiffness: 320,
                      damping: 26,
                      delay: animate ? getRankingRowDelay(index) : 0,
                    }}
                    className={index === rows.length - 1 && animate ? "reveal-results-row--latest" : undefined}
                  >
                    <td className="font-bold text-[#143A5A]">{row.teamName}</td>
                    <td>{formatStage3RevealAnswerDisplay(row.answer, row.passed, row.outcome)}</td>
                    <td>{formatStage3RevealOutcome(row)}</td>
                    <td className="font-extrabold text-primary">
                      {formatStage3PointsDelta(row.pointsDelta)}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
