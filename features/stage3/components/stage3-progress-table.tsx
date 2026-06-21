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
import { STAGE3_ANSWER_ID_PATTERN } from "@/features/stage3/stage3-constants";
import {
  useStage3TeamProgressList,
  type Stage3TeamProgressRow,
} from "@/features/stage3/use-stage3-team-progress-list";
import { TeamLogoBadge } from "@/components/competition/team-logo-badge";
import { useTeamLogosMap } from "@/features/gameflow/team-logos-store";

export function Stage3ProgressTable() {
  const { teams, loading, error } = useStage3TeamProgressList();
  const logos = useTeamLogosMap();

  return (
    <Card>
      <CardHeader>
        <CardTitle>تقدم فرق المرحلة الثالثة (تأسيسي)</CardTitle>
        <CardDescription>
          جدول read-only أثناء حالات على المحك. مسار الإجابات المستقبلي:{" "}
          <span dir="ltr" className="font-mono text-xs">
            {STAGE3_ANSWER_ID_PATTERN}
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? <LoadingState variant="inline" /> : null}
        {error ? <ErrorState title="تعذر تحميل التقدم" description={error} /> : null}
        {!loading && !error && teams.length === 0 ? (
          <EmptyState title="لا توجد فرق مسجلة حتى الآن." />
        ) : null}
        {!loading && !error && teams.length > 0 ? (
          <div className="overflow-x-auto rounded-md border border-primary/10">
            <table className="w-full min-w-[900px] text-right text-sm">
              <thead className="bg-[#F3FAFF] text-[#143A5A]">
                <tr>
                  <th className="px-4 py-3 font-bold">الفريق</th>
                  <th className="px-4 py-3 font-bold">stage3SelectedQuestionId</th>
                  <th className="px-4 py-3 font-bold">progress.stage3.currentField</th>
                  <th className="px-4 py-3 font-bold">progress.stage3.questionIndex</th>
                  <th className="px-4 py-3 font-bold">stageScores.stage3</th>
                  <th className="px-4 py-3 font-bold">المجموع</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary/10 bg-white">
                {teams.map((team) => (
                  <Stage3ProgressRow
                    key={team.teamId}
                    team={team}
                    logoUrl={logos.get(team.teamId)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function Stage3ProgressRow({
  team,
  logoUrl,
}: {
  team: Stage3TeamProgressRow;
  logoUrl?: string | null;
}) {
  return (
    <tr>
      <td className="px-4 py-3 font-bold text-[#143A5A]">
        <span className="flex items-center gap-2">
          <TeamLogoBadge logoUrl={logoUrl} teamName={team.teamName} variant="hud" />
          <span>{team.teamName}</span>
        </span>
      </td>
      <td className="px-4 py-3 font-mono text-xs" dir="ltr">
        {team.stage3SelectedQuestionId}
      </td>
      <td className="px-4 py-3">{team.stage3CurrentField}</td>
      <td className="px-4 py-3">{team.stage3QuestionIndex}</td>
      <td className="px-4 py-3">{team.stage3Score}</td>
      <td className="px-4 py-3">{team.totalScore}</td>
    </tr>
  );
}
