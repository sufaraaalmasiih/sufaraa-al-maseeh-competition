import type { GameFlowStatus } from "@/types";

export const STAGE3_NAME = "على المحك";

export const STAGE3_STATUSES = [
  "stage3_intro",
  "stage3_board",
  "stage3_question_open",
  "stage3_answer_closed",
  "stage3_reveal",
  "stage3_results_done",
  "stage3_finished",
] as const satisfies readonly GameFlowStatus[];

/** Old v9.6 status mapping for docs/debug only */
export const STAGE3_LEGACY_STATUS_MAP = {
  choosing: "stage3_board",
  question_open: "stage3_question_open",
  answer_closed: "stage3_answer_closed",
  revealing: "stage3_reveal",
  results_done: "stage3_results_done",
  finished: "stage3_finished",
} as const;

export type Stage3Status = (typeof STAGE3_STATUSES)[number];

export const STAGE3_ANSWER_ID_PATTERN =
  "competitions/main/answers/stage3_{questionId}_{teamId}";

export function isStage3Status(
  status: GameFlowStatus | null | undefined,
): status is Stage3Status {
  return (
    status !== null &&
    status !== undefined &&
    STAGE3_STATUSES.includes(status as Stage3Status)
  );
}
