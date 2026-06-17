"use client";

import { ErrorState, LoadingState } from "@/components/layout/state-view";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { gameFlowLabels } from "@/features/gameflow/gameflow-copy";
import { STAGE3_NAME } from "@/features/stage3/stage3-constants";
import { useTeamStage3Context } from "@/features/stage3/use-team-stage3-context";
import type { GameFlowStatus } from "@/types";

interface Stage3TeamPlaceholderScreenProps {
  status: GameFlowStatus;
  currentStage: string | null;
}

export function Stage3TeamPlaceholderScreen({
  status,
  currentStage,
}: Stage3TeamPlaceholderScreenProps) {
  const {
    teamName,
    stage3SelectedQuestionId,
    stage3CurrentField,
    stage3QuestionIndex,
    stage3Score,
    loading,
    error,
  } = useTeamStage3Context();

  if (loading) {
    return <LoadingState variant="page" />;
  }

  if (error) {
    return <ErrorState title="تعذر تحميل بيانات الفريق" description={error} />;
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <p className="text-sm font-bold text-[#4F8A10]">{STAGE3_NAME}</p>
        <CardTitle className="text-3xl text-[#143A5A]">
          {gameFlowLabels[status]}
        </CardTitle>
        <CardDescription className="text-base leading-7">
          شاشة تأسيسية — لا توجد إجابات أو نقاط أو مؤقتات بعد.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <InfoItem label="الفريق" value={teamName} />
          <InfoItem label="الدور" value="فريق" />
          <InfoItem label="currentStage" value={currentStage ?? "—"} />
          <InfoItem label="status" value={status} />
          <InfoItem
            label="stage3SelectedQuestionId"
            value={stage3SelectedQuestionId || "—"}
          />
          <InfoItem label="progress.stage3.currentField" value={stage3CurrentField || "—"} />
          <InfoItem
            label="progress.stage3.questionIndex"
            value={String(stage3QuestionIndex)}
          />
          <InfoItem label="stageScores.stage3" value={String(stage3Score)} />
        </div>
        <p className="rounded-md border border-primary/15 bg-[#F3FAFF] px-4 py-3 text-sm leading-7 text-muted-foreground">
          No answers, scoring, or timers implemented yet.
        </p>
      </CardContent>
    </Card>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-primary/15 bg-[#F3FAFF] p-4">
      <p className="text-xs font-bold text-muted-foreground">{label}</p>
      <p className="mt-2 break-words text-lg font-extrabold text-[#143A5A]">{value}</p>
    </div>
  );
}
