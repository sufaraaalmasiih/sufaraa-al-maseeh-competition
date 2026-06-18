import { EmptyState } from "@/components/layout/empty-state";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CompetitionRankingBoard } from "@/components/competition/competition-ranking-board";
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
  hideHeader?: boolean;
}

function toRankingEntries(teams: RankedStage1Team[]) {
  return teams.map((team) => ({
    teamId: team.teamId,
    teamName: team.teamName,
    rank: team.rank,
    stageScore: team.stage1Score,
    governorate: team.governorate,
    logoUrl: team.logoUrl,
    totalScore: team.totalScore,
    extraValue: team.stage1QuestionIndex,
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
  const resolvedTitle =
    title ??
    (audience ? "ترتيب المرحلة الأولى" : "ترتيب المرحلة الأولى المباشر");
  const resolvedDescription =
    description ??
    (audience
      ? "ترتيب مباشر حسب نقاط المرحلة الأولى."
      : "يعتمد الترتيب على نقاط المرحلة الأولى ثم المجموع ثم اسم الفريق.");

  const board = (
    <CompetitionRankingBoard
      animate={animate || audience}
      bare={audience}
      emptyTitle="بانتظار تسجيل الفرق"
      error={error}
      extraColumnLabel="السؤال الحالي"
      loading={loading}
      scoreLabel="نقاط المرحلة الأولى"
      showExtraColumn={!audience}
      showGovernorate={!audience}
      showTotalScore={!audience}
      teams={toRankingEntries(teams)}
      variant={audience ? "audience" : "facilitator"}
    />
  );

  if (audience) {
    return board;
  }

  return (
    <Card>
      {!hideHeader ? (
        <CardHeader>
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
