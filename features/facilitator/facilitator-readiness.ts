import type { FacilitatorReadinessKey } from "@/features/facilitator/facilitator-flow-plan";
import type { Stage1RankingTeam } from "@/features/stage1/stage1-ranking";

export function isTeamReadyForReadiness(
  team: Pick<
    Stage1RankingTeam,
    | "ready"
    | "competitionIntroReady"
    | "stage1IntroReady"
    | "stage2IntroReady"
    | "stage3IntroReady"
    | "stage4IntroReady"
  >,
  key: FacilitatorReadinessKey | null,
): boolean {
  if (!key) {
    return team.ready;
  }

  switch (key) {
    case "competitionIntro":
      return team.competitionIntroReady;
    case "stage1Intro":
      return team.stage1IntroReady;
    case "stage2Intro":
      return team.stage2IntroReady;
    case "stage3Intro":
      return team.stage3IntroReady;
    case "stage4Intro":
      return team.stage4IntroReady;
    default:
      return team.ready;
  }
}
