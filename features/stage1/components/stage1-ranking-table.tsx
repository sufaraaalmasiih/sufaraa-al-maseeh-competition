import { EmptyState } from "@/components/layout/empty-state";
import { ErrorState, LoadingState } from "@/components/layout/state-view";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CompetitionRankingBoard } from "@/components/competition/competition-ranking-board";
import { cn } from "@/lib/utils";
import type { RankedStage1Team } from "@/features/stage1/stage1-ranking";

interface Stage1RankingTableProps {
  teams: RankedStage1Team[];
  loading: boolean;
  error: string | null;
  variant: "facilitator" | "audience";
  title?: string;
  description?: string;
  stageLabel?: string;
  animate?: boolean;
  /** Hide card header when wrapped by audience stage shell */
  hideHeader?: boolean;
}

const topRankStyles: Record<number, string> = {
  1: "bg-[#FFF7DF]",
  2: "bg-[#F3FAFF]",
  3: "bg-[#F1F9E8]",
};

function toRankingEntries(teams: RankedStage1Team[]) {
  return teams.map((team) => ({
    teamId: team.teamId,
    teamName: team.teamName,
    rank: team.rank,
    stageScore: team.stage1Score,
    governorate: team.governorate,
    logoUrl: team.logoUrl,
    totalScore: team.totalScore,
  }));
}

export function Stage1RankingTable({
  teams,
  loading,
  error,
  variant,
  title,
  description,
  stageLabel = "اجمعوا الكنوز",
  animate = false,
  hideHeader = false,
}: Stage1RankingTableProps) {
  const audience = variant === "audience";

  return (
    <Card className={hideHeader ? "border-0 bg-transparent shadow-none" : undefined}>
      {hideHeader ? null : (
      <CardHeader className={audience ? "text-center" : undefined}>
        {audience ? (
          <p className="text-sm font-bold text-[#4F8A10]">{stageLabel}</p>
        ) : null}
        <CardTitle>
          {title ??
            (audience
              ? "ترتيب المرحلة الأولى"
              : "ترتيب المرحلة الأولى المباشر")}
        </CardTitle>
        <CardDescription>
          {description ??
            (audience
              ? "ترتيب مباشر حسب نقاط المرحلة الأولى."
              : "يعتمد الترتيب على نقاط المرحلة الأولى ثم المجموع ثم اسم الفريق.")}
        </CardDescription>
      </CardHeader>
      )}
      <CardContent className={hideHeader ? "p-0" : undefined}>
        {audience ? (
          <CompetitionRankingBoard
            animate={animate}
            bare
            error={error}
            loading={loading}
            scoreLabel="نقطة"
            teams={toRankingEntries(teams)}
            variant="embedded"
          />
        ) : null}
        {!audience && loading ? <LoadingState variant="inline" /> : null}
        {!audience && error ? <ErrorState title="تعذر تحميل الترتيب" description={error} /> : null}
        {!audience && !loading && !error && teams.length === 0 ? (
          <EmptyState title="بانتظار تسجيل الفرق" />
        ) : null}
        {!loading && !error && teams.length > 0 && !audience ? (
          <div className="overflow-x-auto competition-ranking-scroll">
            <table className="competition-ranking-table w-full min-w-[640px] text-right text-sm">
              <thead className="bg-[#F3FAFF] text-[#143A5A]">
                <tr>
                  <th className="px-4 py-3 font-bold">المركز</th>
                  <th className="px-4 py-3 font-bold">الفريق</th>
                  <th className="px-4 py-3 font-bold">المحافظة</th>
                  <th className="px-4 py-3 font-bold">نقاط المرحلة الأولى</th>
                  <th className="px-4 py-3 font-bold">المجموع</th>
                  <th className="px-4 py-3 font-bold">السؤال الحالي</th>
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
                    <td className="px-4 py-3">{team.governorate}</td>
                    <td className="px-4 py-3 text-xl font-extrabold text-primary">
                      {team.stage1Score}
                    </td>
                    <td className="px-4 py-3 font-bold">{team.totalScore}</td>
                    <td className="px-4 py-3">{team.stage1QuestionIndex}</td>
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
