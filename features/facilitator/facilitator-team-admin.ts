export {
  adjustTeamScore,
  setTeamStageScores,
} from "@/features/facilitator/facilitator-team-admin-score";
export {
  resetTeamStageProgress,
  resetAllTeamScores,
  migrateAllTeamsToStage,
} from "@/features/facilitator/facilitator-team-admin-progress";
export {
  updateTeamProfile,
  updateTeamFullProfile,
  updateTeamLogo,
  removeTeamFromCompetition,
} from "@/features/facilitator/facilitator-team-admin-profile";
export {
  setTeamStageLocks,
  toggleTeamStageLock,
  readTeamStageLocks,
} from "@/features/facilitator/facilitator-team-admin-locks";
export {
  setTeamFacilitatorOverride,
  clearTeamFacilitatorOverride,
} from "@/features/facilitator/facilitator-team-admin-override";
export {
  deleteTeamAnswers,
  resetTeamCompetitionData,
  deleteTeamCompletely,
} from "@/features/facilitator/facilitator-team-admin-destructive";

export type { AdminStageKey } from "@/features/facilitator/team-control-types";
export { parseTeamFacilitatorOverride } from "@/features/facilitator/team-control-types";
