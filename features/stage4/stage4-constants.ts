import type { GameFlowStatus } from "@/types";

export const STAGE4_NAME = "اثبتوا بالحق";
export const STAGE4_DEFAULT_QUESTION_COUNT = 15;

export const STAGE4_STATUSES: GameFlowStatus[] = [
  "stage4_intro",
  "stage4_waiting_question",
  "stage4_question_open",
  "stage4_answers_closed",
  "stage4_reveal",
  "stage4_finished",
];

export function isStage4Status(status: GameFlowStatus): boolean {
  return STAGE4_STATUSES.includes(status);
}
