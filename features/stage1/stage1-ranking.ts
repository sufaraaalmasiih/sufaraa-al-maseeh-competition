export interface Stage1RankingTeam {
  teamId: string;
  teamName: string;
  governorate: string;
  ready: boolean;
  competitionIntroReady: boolean;
  stage1IntroReady: boolean;
  stage1Score: number;
  totalScore: number;
  stage1QuestionIndex: number;
}

export interface RankedStage1Team extends Stage1RankingTeam {
  rank: number;
}

export function sortStage1Ranking(
  teams: Stage1RankingTeam[],
): Stage1RankingTeam[] {
  return [...teams].sort((first, second) => {
    if (second.stage1Score !== first.stage1Score) {
      return second.stage1Score - first.stage1Score;
    }

    if (second.totalScore !== first.totalScore) {
      return second.totalScore - first.totalScore;
    }

    return first.teamName.localeCompare(second.teamName, "ar");
  });
}

export function rankStage1Teams(teams: Stage1RankingTeam[]): RankedStage1Team[] {
  return sortStage1Ranking(teams).map((team, index) => ({
    ...team,
    rank: index + 1,
  }));
}
