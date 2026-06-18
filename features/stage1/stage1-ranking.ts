import {
  assignCompetitionRanks,
  compareFinishSpeed,
} from "@/lib/competition-rank-assignment";

export interface Stage1RankingTeam {
  teamId: string;
  teamName: string;
  governorate: string;
  logoUrl?: string | null;
  ready: boolean;
  competitionIntroReady: boolean;
  stage1IntroReady: boolean;
  stage2IntroReady: boolean;
  stage3IntroReady: boolean;
  stage4IntroReady: boolean;
  stage1Score: number;
  totalScore: number;
  stage1QuestionIndex: number;
  /** طابع زمني لآخر نشاط مُسجِّل للنقاط في المرحلة — لكسر التعادل بالأسرع. */
  finishedAtMs?: number | null;
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

    const bySpeed = compareFinishSpeed(first.finishedAtMs, second.finishedAtMs);
    if (bySpeed !== 0) {
      return bySpeed;
    }

    return first.teamName.localeCompare(second.teamName, "ar");
  });
}

export function rankStage1Teams(teams: Stage1RankingTeam[]): RankedStage1Team[] {
  return assignCompetitionRanks(
    sortStage1Ranking(teams),
    (team) => `${team.stage1Score}|${team.totalScore}`,
  );
}
