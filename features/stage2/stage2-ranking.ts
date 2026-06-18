export interface Stage2RankingTeam {
  teamId: string;
  teamName: string;
  governorate: string;
  logoUrl?: string | null;
  ready: boolean;
  stage2Score: number;
  totalScore: number;
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

    return first.teamName.localeCompare(second.teamName, "ar");
  });
}

export function getStage2Ranking(teams: Stage2RankingTeam[]): RankedStage2Team[] {
  return sortStage2Ranking(teams).map((team, index) => ({
    ...team,
    rank: index + 1,
  }));
}
