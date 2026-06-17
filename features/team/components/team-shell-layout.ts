import {
  getCompetitionShellContentClassName,
  isArenaGameplayStatus,
  shouldCenterCompetitionShellContent,
} from "@/features/gameflow/flow-shell-layout";
import type { GameFlowStatus } from "@/types";

export {
  CENTERED_STAGE_STATUSES as TEAM_CENTERED_STAGE_STATUSES,
  isArenaGameplayStatus as isTeamArenaGameplayStatus,
  isStage3ArenaStatus as isTeamStage3ArenaStatus,
  isStage4ArenaStatus as isTeamStage4ArenaStatus,
} from "@/features/gameflow/flow-shell-layout";

export function getTeamShellContentClassName(
  status: GameFlowStatus | null | undefined,
): string | undefined {
  return getCompetitionShellContentClassName(status);
}

export function shouldCenterTeamShellContent(
  status: GameFlowStatus | null | undefined,
  loading: boolean,
): boolean {
  return shouldCenterCompetitionShellContent(status, loading);
}

export function shouldScrollTeamShellContent(
  status: GameFlowStatus | null | undefined,
  loading: boolean,
): boolean {
  if (loading || !status || status === "waiting_players") {
    return false;
  }

  if (isArenaGameplayStatus(status)) {
    return false;
  }

  return true;
}
