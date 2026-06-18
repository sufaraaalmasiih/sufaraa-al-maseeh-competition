import { EmptyState } from "@/components/layout/empty-state";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CompetitionRankingBoard } from "@/components/competition/competition-ranking-board";
import type { RankedStage2Team } from "@/features/stage2/stage2-ranking";

interface Stage2RankingTableProps {
  teams: RankedStage2Team[];
  loading: boolean;
  error: string | null;
  variant: "facilitator" | "audience";
  title?: string;
  description?: string;
  stageLabel?: string;
  animate?: boolean;
  hideHeader?: boolean;
}

function toRankingEntries(teams: RankedStage2Team[]) {
  return teams.map((team) => ({
    teamId: team.teamId,
    teamName: team.teamName,
    rank: team.rank,
    stageScore: team.stage2Score,
    governorate: team.governorate,
    logoUrl: team.logoUrl,
    totalScore: team.totalScore,
  }));
}

export function Stage2RankingTable({
  teams,
  loading,
  error,
  variant,
  title,
  description,
  stageLabel = "فتشوا الكتب",
  animate = false,
  hideHeader = false,
}: Stage2RankingTableProps) {
  const audience = variant === "audience";
  const resolvedTitle = title ?? "نتائج مرحلة فتشوا الكتب";
  const resolvedDescription =
    description ??
    (audience
      ? "ترتيب مباشر حسب نقاط المرحلة الثانية."
      : "يعتمد الترتيب على نقاط المرحلة الثانية ثم المجموع ثم اسم الفريق.");

  const board = (
    <CompetitionRankingBoard
      animate={animate || audience}
      bare={audience}
      emptyTitle="بانتظار تسجيل الفرق"
      error={error}
      loading={loading}
      scoreLabel="نقاط المرحلة الثانية"
      showGovernorate={!audience}
      teams={toRankingEntries(teams)}
      variant={audience ? "embedded" : "facilitator"}
    />
  );

  if (audience) {
    return board;
  }

  return (
    <Card className={hideHeader ? "border-0 bg-transparent shadow-none" : undefined}>
      {!hideHeader ? (
        <CardHeader className={audience ? "text-center" : undefined}>
          {audience ? (
            <p className="text-sm font-bold text-[#4F8A10]">{stageLabel}</p>
          ) : null}
          <CardTitle>{resolvedTitle}</CardTitle>
          <CardDescription>{resolvedDescription}</CardDescription>
        </CardHeader>
      ) : null}
      <CardContent className={hideHeader ? "p-0" : undefined}>
        {!loading && !error && teams.length === 0 ? (
          <EmptyState title="بانتظار تسجيل الفرق" />
        ) : (
          board
        )}
      </CardContent>
    </Card>
  );
}
