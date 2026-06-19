import { STAGE3_BOARD_QUESTION_COUNT } from "@/features/stage3/stage3-board-data";
import { getRuntimeStage3Questions } from "@/features/facilitator/question-bank-runtime-cache";
import type { GameFlowStatus } from "@/types";

const STAGE3_GAMEPLAY_STATUSES = new Set<GameFlowStatus>([
  "stage3_board",
  "stage3_question_open",
  "stage3_answer_closed",
  "stage3_reveal",
  "stage3_results_done",
]);

const STAGE4_GAMEPLAY_STATUSES = new Set<GameFlowStatus>([
  "stage4_waiting_question",
  "stage4_question_open",
  "stage4_answers_closed",
  "stage4_reveal",
]);

export function isStage3GameplayStatus(status: GameFlowStatus | null | undefined): boolean {
  return status !== null && status !== undefined && STAGE3_GAMEPLAY_STATUSES.has(status);
}

export function isStage4GameplayStatus(status: GameFlowStatus | null | undefined): boolean {
  return status !== null && status !== undefined && STAGE4_GAMEPLAY_STATUSES.has(status);
}

export function isStage3BoardExhausted(usedQuestionIds: string[]): boolean {
  // اللوحة الآن تتبع البنك: العدد الكلي = أسئلة المرحلة 3 المخزَّنة إن وُجدت،
  // وإلا عدد اللوحة الافتراضي (30) — فتعمل مع البنوك المخصّصة (أقل/أكثر).
  const bankCount = getRuntimeStage3Questions().length;
  const total = bankCount > 0 ? bankCount : STAGE3_BOARD_QUESTION_COUNT;
  return usedQuestionIds.length >= total;
}

export function isStage4TeamParticipationComplete(
  answeredQuestionIds: string[],
  questionCount: number,
): boolean {
  return questionCount > 0 && answeredQuestionIds.length >= questionCount;
}

export interface TeamStageEarlyFinishState {
  stage1Complete: boolean;
  stage2Complete: boolean;
  stage3Complete: boolean;
  stage4Complete: boolean;
}

export function getTeamDisplayStatus(
  status: GameFlowStatus | null | undefined,
  completion: TeamStageEarlyFinishState,
): GameFlowStatus | null | undefined {
  if (!status) {
    return status;
  }

  if (status === "stage1_running" && completion.stage1Complete) {
    return "stage1_finished";
  }

  if (status === "stage2_player_turns" && completion.stage2Complete) {
    return "stage2_finished";
  }

  if (isStage3GameplayStatus(status) && completion.stage3Complete) {
    return "stage3_finished";
  }

  if (isStage4GameplayStatus(status) && completion.stage4Complete) {
    return "stage4_finished";
  }

  return status;
}

export function isTeamStageEarlyFinished(
  status: GameFlowStatus | null | undefined,
  completion: TeamStageEarlyFinishState,
): boolean {
  return (
    (status === "stage1_running" && completion.stage1Complete) ||
    (status === "stage2_player_turns" && completion.stage2Complete) ||
    (isStage3GameplayStatus(status) && completion.stage3Complete) ||
    (isStage4GameplayStatus(status) && completion.stage4Complete)
  );
}
