import {
  isStage3GameplayStatus,
  isStage4GameplayStatus,
} from "@/features/team/team-stage-early-finish";
import type { GameFlowStatus } from "@/types";

export const CENTERED_STAGE_STATUSES = new Set<GameFlowStatus>([
  "stage1_finished",
  "stage2_finished",
  "stage3_finished",
  "stage4_finished",
  "final_results",
  "podium",
]);

export function isArenaGameplayStatus(status: GameFlowStatus | null | undefined): boolean {
  if (!status) {
    return false;
  }

  return (
    status === "stage1_running" ||
    status === "stage2_player_turns" ||
    isStage3GameplayStatus(status) ||
    isStage4GameplayStatus(status)
  );
}

export function isStage3ArenaStatus(status: GameFlowStatus | null | undefined): boolean {
  return isStage3GameplayStatus(status);
}

export function isStage4ArenaStatus(status: GameFlowStatus | null | undefined): boolean {
  return isStage4GameplayStatus(status);
}

export function getCompetitionShellContentClassName(
  status: GameFlowStatus | null | undefined,
): string | undefined {
  if (!status || status === "waiting_players") {
    return undefined;
  }

  if (status === "competition_intro") {
    return "competition-intro-screen__wrap px-4 py-8";
  }

  if (
    status === "stage1_intro" ||
    status === "stage2_intro" ||
    status === "stage3_intro" ||
    status === "stage4_intro"
  ) {
    return "competition-flow-shell__wrap";
  }

  if (status === "stage2_role_assignment") {
    return "stage2-role-assignment-screen__wrap";
  }

  if (status === "stage2_reading") {
    return "stage2-reading-screen__wrap";
  }

  if (CENTERED_STAGE_STATUSES.has(status)) {
    return "competition-centered-screen__wrap";
  }

  if (!isArenaGameplayStatus(status)) {
    return "content-shell px-4 py-8";
  }

  if (isStage3ArenaStatus(status)) {
    if (status === "stage3_board") {
      return "content-shell-arena content-shell-arena--stage3 content-shell-arena--stage3-board px-2 py-3 sm:px-4";
    }
    return "content-shell-arena content-shell-arena--stage3 px-2 py-3 sm:px-4";
  }

  if (isStage4ArenaStatus(status)) {
    return "content-shell-arena content-shell-arena--stage4 px-2 py-3 sm:px-4";
  }

  if (status === "stage2_player_turns") {
    return "content-shell-arena content-shell-arena--stage2 px-2 py-2 sm:px-3";
  }

  return "content-shell-arena px-2 py-4 sm:px-3";
}

export function shouldScrollCompetitionShellContent(
  status: GameFlowStatus | null | undefined,
  loading: boolean,
): boolean {
  if (loading) {
    return false;
  }

  return Boolean(status && status !== "waiting_players");
}

export function shouldCenterCompetitionShellContent(
  status: GameFlowStatus | null | undefined,
  loading: boolean,
): boolean {
  if (loading || !status || status === "waiting_players") {
    return true;
  }

  if (
    status === "competition_intro" ||
    status === "stage1_intro" ||
    status === "stage2_intro" ||
    status === "stage3_intro" ||
    status === "stage2_role_assignment" ||
    status === "stage2_reading" ||
    status === "stage4_intro"
  ) {
    return true;
  }

  return CENTERED_STAGE_STATUSES.has(status);
}
