import {
  assignCompetitionRanks,
  compareFinishSpeed,
} from "@/lib/competition-rank-assignment";

export interface Stage2RankingTeam {
  teamId: string;
  teamName: string;
  governorate: string;
  logoUrl?: string | null;
  ready: boolean;
  stage2Score: number;
  totalScore: number;
  /** طابع زمني لآخر نشاط مُسجِّل للنقاط في المرحلة — لكسر التعادل بالأسرع. */
  finishedAtMs?: number | null;
}

export interface RankedStage2Team extends Stage2RankingTeam {
  rank: number;
}

export function sortStage2Ranking(
  teams: Stage2RankingTeam[],
): Stage2RankingTeam[] {
  return [...teams].sort((first, second) => {
    if (second.stage2Score !== first.stage2Score) {
      return second.stage2Score - first.stage2Score;
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

export function getStage2Ranking(teams: Stage2RankingTeam[]): RankedStage2Team[] {
  return assignCompetitionRanks(
    sortStage2Ranking(teams),
    (team) => `${team.stage2Score}|${team.totalScore}`,
  );
}
