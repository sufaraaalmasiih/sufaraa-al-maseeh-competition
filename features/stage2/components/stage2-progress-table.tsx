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
import { STAGE2_FIELD_COUNT } from "@/features/stage2/stage2-field-sequence";
import {
  useStage2TeamProgressList,
  type Stage2TeamProgressRow,
} from "@/features/stage2/use-stage2-team-progress-list";

export function Stage2ProgressTable() {
  const { teams, loading, error } = useStage2TeamProgressList();

  return (
    <Card>
      <CardHeader>
        <CardTitle>تقدم فرق المرحلة الثانية</CardTitle>
        <CardDescription>
          متابعة read-only لمجال كل فريق أثناء status = stage2_player_turns.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? <LoadingState /> : null}
        {error ? <ErrorState title="تعذر تحميل التقدم" description={error} /> : null}
        {!loading && !error && teams.length === 0 ? (
          <EmptyState title="لا توجد فرق مسجلة حتى الآن." />
        ) : null}
        {!loading && !error && teams.length > 0 ? (
          <div className="overflow-x-auto rounded-md border border-primary/10">
            <table className="w-full min-w-[1100px] text-right text-sm">
              <thead className="bg-[#F3FAFF] text-[#143A5A]">
                <tr>
                  <th className="px-4 py-3 font-bold">الفريق</th>
                  <th className="px-4 py-3 font-bold">المجال الحالي</th>
                  <th className="px-4 py-3 font-bold">رقم المجال</th>
                  <th className="px-4 py-3 font-bold">المتسابق</th>
                  <th className="px-4 py-3 font-bold">سؤال التوصيل</th>
                  <th className="px-4 py-3 font-bold">نقاط المرحلة الثانية</th>
                  <th className="px-4 py-3 font-bold">المجموع</th>
                  <th className="px-4 py-3 font-bold">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary/10 bg-white">
                {teams.map((team) => (
                  <Stage2ProgressRow key={team.teamId} team={team} />
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function Stage2ProgressRow({ team }: { team: Stage2TeamProgressRow }) {
  return (
    <tr>
      <td className="px-4 py-3 font-bold text-[#143A5A]">{team.teamName}</td>
      <td className="px-4 py-3">{team.currentFieldLabel}</td>
      <td className="px-4 py-3">
        {team.isComplete
          ? `${STAGE2_FIELD_COUNT} / ${STAGE2_FIELD_COUNT}`
          : team.fieldOrder
            ? `${team.fieldOrder} / ${STAGE2_FIELD_COUNT}`
            : "—"}
      </td>
      <td className="px-4 py-3">{team.isComplete ? "—" : team.assignedPlayerName}</td>
      <td className="px-4 py-3">{team.stage2QuestionIndex}</td>
      <td className="px-4 py-3">{team.stage2Score}</td>
      <td className="px-4 py-3">{team.totalScore}</td>
      <td className="px-4 py-3">
        {team.isComplete ? (
          <span className="font-bold text-[#4F8A10]">اكتملت جميع المجالات</span>
        ) : (
          "قيد التنفيذ"
        )}
      </td>
    </tr>
  );
}
