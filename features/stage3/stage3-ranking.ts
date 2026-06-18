import {
  assignCompetitionRanks,
  compareFinishSpeed,
} from "@/lib/competition-rank-assignment";

export interface Stage3RankingTeam {
  teamId: string;
  teamName: string;
  governorate: string;
  logoUrl?: string | null;
  ready: boolean;
  stage3Score: number;
  totalScore: number;
  /** طابع زمني لآخر نشاط مُسجِّل للنقاط في المرحلة — لكسر التعادل بالأسرع. */
  finishedAtMs?: number | null;
}

export interface RankedStage3Team extends Stage3RankingTeam {
  rank: number;
}

export function sortStage3Ranking(teams: Stage3RankingTeam[]): Stage3RankingTeam[] {
  return [...teams].sort((first, second) => {
    if (second.stage3Score !== first.stage3Score) {
      return second.stage3Score - first.stage3Score;
    }

    if (second.totalScore !== first.totalScore) {
      return second.totalScore - first.totalScore;
    }

    const bySpeed = compareFinishSpeed(first.finishedAtMs, second.finishedAtMs);
    if (bySpeed !== 0) {
      return bySpeed;
    }

    return first.teamName.localeCompare(second.teamName, "ar");
  });
}

export function getStage3Ranking(teams: Stage3RankingTeam[]): RankedStage3Team[] {
  return assignCompetitionRanks(
    sortStage3Ranking(teams),
    (team) => `${team.stage3Score}|${team.totalScore}`,
  );
}
