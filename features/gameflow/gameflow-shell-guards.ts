import { isStage3Status } from "@/features/stage3/stage3-constants";
import { isStage4Status } from "@/features/stage4/stage4-constants";
import type { GameFlowStatus } from "@/types";

export type GameFlowShellRole = "team" | "audience";

const TEAM_HANDLED_STAGE3_STATUSES = new Set<GameFlowStatus>([
  "stage3_intro",
  "stage3_board",
  "stage3_question_open",
  "stage3_answer_closed",
  "stage3_reveal",
  "stage3_results_done",
  "stage3_finished",
]);

const AUDIENCE_HANDLED_STAGE3_STATUSES = new Set<GameFlowStatus>([
  "stage3_board",
  "stage3_question_open",
  "stage3_answer_closed",
  "stage3_reveal",
  "stage3_results_done",
  "stage3_finished",
]);

const TEAM_GLOBAL_PLACEHOLDER_EXCLUSIONS = new Set<GameFlowStatus>([
  "waiting_players",
  "competition_intro",
  "stage1_intro",
  "stage1_running",
  "stage1_finished",
  "stage2_intro",
  "stage2_role_assignment",
  "stage2_reading",
  "stage2_player_turns",
  "stage2_finished",
  "final_results",
  "podium",
]);

const AUDIENCE_GLOBAL_PLACEHOLDER_EXCLUSIONS = new Set<GameFlowStatus>([
  "competition_intro",
  "stage1_intro",
  "stage1_running",
  "stage1_finished",
  "stage2_intro",
  "stage2_role_assignment",
  "stage2_reading",
  "stage2_player_turns",
  "stage2_finished",
  "final_results",
  "podium",
]);

export function shouldShowStage3Placeholder(
  status: GameFlowStatus,
  role: GameFlowShellRole,
): boolean {
  if (!isStage3Status(status)) {
    return false;
  }

  const handled =
    role === "team" ? TEAM_HANDLED_STAGE3_STATUSES : AUDIENCE_HANDLED_STAGE3_STATUSES;

  return !handled.has(status);
}

export function shouldShowGlobalPlaceholder(
  status: GameFlowStatus,
  role: GameFlowShellRole,
): boolean {
  if (isStage3Status(status) || isStage4Status(status)) {
    return false;
  }

  const exclusions =
    role === "team"
      ? TEAM_GLOBAL_PLACEHOLDER_EXCLUSIONS
      : AUDIENCE_GLOBAL_PLACEHOLDER_EXCLUSIONS;

  return !exclusions.has(status);
}
