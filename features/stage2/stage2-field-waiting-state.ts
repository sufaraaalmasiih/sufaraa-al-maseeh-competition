import { isStage2FieldQuestionsComplete } from "@/features/stage2/stage2-field-completion";
import type { Stage2ProgressState } from "@/features/stage2/stage2-progress";
import type { GameFlowStatus } from "@/types";

export function isTeamStage2FieldWaiting(
  status: GameFlowStatus | null | undefined,
  progress: Stage2ProgressState,
  rolesLocked: boolean,
): boolean {
  if (status !== "stage2_player_turns" || !rolesLocked || progress.isComplete) {
    return false;
  }

  return isStage2FieldQuestionsComplete(
    progress.stage2FieldIndex,
    progress.stage2QuestionIndex,
    progress.isComplete,
  );
}
