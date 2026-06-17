import type { FlowScreenTransitionVariant } from "@/components/motion/flow-screen-transition";
import type { GameFlowStatus } from "@/types";

export type FlowTransitionRole = "team" | "audience";

/**
 * Statuses that share one visual scene — changing between them must NOT
 * re-run the outer screen transition (e.g. reveal → results_done).
 */
const TRANSITION_KEY_BY_STATUS: Partial<Record<GameFlowStatus, string>> = {
  stage3_reveal: "stage3-post-answer",
  stage3_results_done: "stage3-post-answer",
  stage4_waiting_question: "stage4-question-cycle",
  stage4_question_open: "stage4-question-cycle",
  stage4_answers_closed: "stage4-question-cycle",
};

const REVEAL_TRANSITION_KEYS = new Set(["stage3-post-answer"]);

const STAGE_TRANSITION_STATUSES = new Set<GameFlowStatus>([
  "competition_intro",
  "stage1_intro",
  "stage1_finished",
  "stage2_intro",
  "stage2_finished",
  "stage3_intro",
  "stage3_finished",
  "stage4_intro",
  "stage4_finished",
  "final_results",
  "podium",
]);

const SHARED_STATIC_GAMEPLAY_STATUSES: GameFlowStatus[] = [
  "stage1_running",
  "stage3_board",
  "stage3_question_open",
  "stage3_answer_closed",
  "stage4_question_open",
  "stage4_waiting_question",
  "stage4_answers_closed",
];

const TEAM_STATIC_GAMEPLAY_STATUSES: GameFlowStatus[] = [
  ...SHARED_STATIC_GAMEPLAY_STATUSES,
  "stage2_role_assignment",
  "stage2_reading",
  "stage2_player_turns",
];

const AUDIENCE_STATIC_GAMEPLAY_STATUSES: GameFlowStatus[] = [
  ...SHARED_STATIC_GAMEPLAY_STATUSES,
  "stage2_reading",
];

export function getFlowTransitionKey(
  status: GameFlowStatus | null | undefined,
): string {
  if (!status) {
    return "unknown";
  }

  return TRANSITION_KEY_BY_STATUS[status] ?? status;
}

export function shouldUseInstantFlowTransition(
  status: GameFlowStatus | null | undefined,
  role: FlowTransitionRole,
  loading?: boolean,
): boolean {
  if (loading || !status) {
    return true;
  }

  const staticStatuses =
    role === "team" ? TEAM_STATIC_GAMEPLAY_STATUSES : AUDIENCE_STATIC_GAMEPLAY_STATUSES;

  return staticStatuses.includes(status);
}

export function getFlowTransitionVariant(
  status: GameFlowStatus | null | undefined,
): FlowScreenTransitionVariant {
  if (!status) {
    return "default";
  }

  const transitionKey = getFlowTransitionKey(status);

  if (status === "stage4_reveal" || REVEAL_TRANSITION_KEYS.has(transitionKey)) {
    return "reveal";
  }

  if (STAGE_TRANSITION_STATUSES.has(status)) {
    return "stage";
  }

  return "default";
}
