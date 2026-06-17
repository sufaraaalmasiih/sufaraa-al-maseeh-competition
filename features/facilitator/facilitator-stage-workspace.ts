import { isStage3Status } from "@/features/stage3/stage3-constants";
import { isStage4Status } from "@/features/stage4/stage4-constants";
import type { GameFlowStatus } from "@/types";

/** True when the flow tab renders a dedicated stage workspace (board, stage 4 panel, finished screens). */
export function hasFacilitatorStageWorkspace(status: GameFlowStatus): boolean {
  if (status === "stage2_player_turns") {
    return true;
  }
  if (isStage3Status(status) && status !== "stage3_intro") {
    return true;
  }
  if (isStage4Status(status)) {
    return true;
  }
  return false;
}

export function shouldShowPhaseCanvas(status: GameFlowStatus): boolean {
  if (status === "waiting_players") {
    return false;
  }
  if (hasFacilitatorStageWorkspace(status)) {
    return false;
  }
  const redundantIntros = [
    "competition_intro",
    "stage1_intro",
    "stage2_intro",
    "stage3_intro",
  ] as const;
  if ((redundantIntros as readonly string[]).includes(status)) {
    return false;
  }
  return true;
}
