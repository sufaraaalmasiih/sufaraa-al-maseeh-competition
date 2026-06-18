export interface Stage3RankingTeam {
  teamId: string;
  teamName: string;
  governorate: string;
  logoUrl?: string | null;
  ready: boolean;
  stage3Score: number;
  totalScore: number;
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

    return first.teamName.localeCompare(second.teamName, "ar");
  });
}

export function getStage3Ranking(teams: Stage3RankingTeam[]): RankedStage3Team[] {
  return sortStage3Ranking(teams).map((team, index) => ({
    ...team,
    rank: index + 1,
  }));
}
