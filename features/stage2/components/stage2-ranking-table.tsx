import { EmptyState } from "@/components/layout/empty-state";
import { ErrorState, LoadingState } from "@/components/layout/state-view";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { RankedStage2Team } from "@/features/stage2/stage2-ranking";
import { cn } from "@/lib/utils";

interface Stage2RankingTableProps {
  teams: RankedStage2Team[];
  loading: boolean;
  error: string | null;
  variant: "facilitator" | "audience";
  title?: string;
  description?: string;
  stageLabel?: string;
}

const topRankStyles: Record<number, string> = {
  1: "bg-[#FFF7DF]",
  2: "bg-[#F3FAFF]",
  3: "bg-[#F1F9E8]",
};

export function Stage2RankingTable({
  teams,
  loading,
  error,
  variant,
  title,
  description,
  stageLabel = "فتشوا الكتب",
}: Stage2RankingTableProps) {
  const audience = variant === "audience";

  return (
    <Card>
      <CardHeader className={audience ? "text-center" : undefined}>
        {audience ? (
          <p className="text-sm font-bold text-[#4F8A10]">{stageLabel}</p>
        ) : null}
        <CardTitle>
          {title ??
            (audience
              ? "نتائج مرحلة فتشوا الكتب"
              : "نتائج مرحلة فتشوا الكتب")}
        </CardTitle>
        <CardDescription>
          {description ??
            (audience
              ? "ترتيب مباشر حسب نقاط المرحلة الثانية."
              : "يعتمد الترتيب على نقاط المرحلة الثانية ثم المجموع ثم اسم الفريق.")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? <LoadingState /> : null}
        {error ? <ErrorState title="تعذر تحميل الترتيب" description={error} /> : null}
        {!loading && !error && teams.length === 0 ? (
          <EmptyState title="بانتظار تسجيل الفرق" />
        ) : null}
        {!loading && !error && teams.length > 0 && audience ? (
          <div className="space-y-3">
            {teams.map((team) => (
              <div
                key={team.teamId}
                className={cn(
                  "grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-md border border-primary/10 bg-white p-4",
                  topRankStyles[team.rank],
                )}
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-xl font-extrabold text-primary-foreground">
                  {team.rank}
                </div>
                <div className="min-w-0">
                  <p className="break-words text-lg font-extrabold leading-7 text-[#143A5A]">
                    {team.teamName}
                  </p>
                  <p className="text-sm font-semibold text-muted-foreground">
                    {team.governorate}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-extrabold text-primary">
                    {team.stage2Score}
                  </p>
                  <p className="text-xs font-bold text-muted-foreground">نقطة</p>
                </div>
              </div>
            ))}
          </div>
        ) : null}
        {!loading && !error && teams.length > 0 && !audience ? (
          <div className="overflow-x-auto rounded-md border border-primary/10">
            <table className="w-full min-w-[560px] text-right text-sm">
              <thead className="bg-[#F3FAFF] text-[#143A5A]">
                <tr>
                  <th className="px-4 py-3 font-bold">المركز</th>
                  <th className="px-4 py-3 font-bold">الفريق</th>
                  <th className="px-4 py-3 font-bold">نقاط المرحلة الثانية</th>
                  <th className="px-4 py-3 font-bold">المجموع</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary/10 bg-white">
                {teams.map((team) => (
                  <tr
                    key={team.teamId}
                    className={cn(topRankStyles[team.rank] ?? "bg-white")}
                  >
                    <td className="px-4 py-3 text-lg font-extrabold text-[#143A5A]">
                      {team.rank}
                    </td>
                    <td className="px-4 py-3 font-bold text-[#143A5A]">
                      {team.teamName}
                    </td>
                    <td className="px-4 py-3 text-xl font-extrabold text-primary">
                      {team.stage2Score}
                    </td>
                    <td className="px-4 py-3 font-bold">{team.totalScore}</td>
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
