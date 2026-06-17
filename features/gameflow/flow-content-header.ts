import { isTeamGameplayStatus } from "@/features/team/competition-stage-labels";
import type { GameFlowStatus } from "@/types";

const INTRO_FLOW_STATUSES = new Set<GameFlowStatus>([
  "stage1_intro",
  "stage2_intro",
  "stage3_intro",
  "stage4_intro",
]);

const FINISHED_FLOW_STATUSES = new Set<GameFlowStatus>([
  "stage1_finished",
  "stage2_finished",
  "stage3_finished",
  "stage4_finished",
  "final_results",
  "podium",
]);

export function shouldShowGameplayFlowHeader(
  status: GameFlowStatus | null | undefined,
  loading?: boolean,
): boolean {
  if (loading || !status || status === "waiting_players" || status === "competition_intro") {
    return false;
  }

  if (FINISHED_FLOW_STATUSES.has(status)) {
    return false;
  }

  return INTRO_FLOW_STATUSES.has(status) || isTeamGameplayStatus(status);
}

const STATUSES_WITHOUT_VERTICAL_CENTER = new Set<GameFlowStatus>([
  "stage3_board",
  "stage3_question_open",
  "stage3_answer_closed",
  "stage3_results_done",
  "stage3_reveal",
  "stage4_reveal",
]);

export function shouldFillFlowViewport(
  status: GameFlowStatus | null | undefined,
  loading?: boolean,
): boolean {
  if (loading || !status || status === "waiting_players") {
    return false;
  }

  if (INTRO_FLOW_STATUSES.has(status)) {
    return true;
  }

  return (
    status === "stage1_running" ||
    status === "stage2_role_assignment" ||
    status === "stage2_player_turns" ||
    status.startsWith("stage3_") ||
    status === "stage4_question_open" ||
    status === "stage4_reveal" ||
    status === "stage4_answers_closed" ||
    status === "stage4_waiting_question"
  );
}

export function shouldCenterFlowBody(status: GameFlowStatus | null | undefined): boolean {
  if (!status || STATUSES_WITHOUT_VERTICAL_CENTER.has(status)) {
    return false;
  }

  if (INTRO_FLOW_STATUSES.has(status) || FINISHED_FLOW_STATUSES.has(status)) {
    return true;
  }

  return shouldFillFlowViewport(status);
}

export function shouldAlignAudienceRevealTrack(
  status: GameFlowStatus | null | undefined,
): boolean {
  return (
    status === "stage3_question_open" ||
    status === "stage3_answer_closed" ||
    status === "stage3_results_done" ||
    status === "stage3_reveal" ||
    status === "stage4_reveal"
  );
}
