import { advanceStage3Turn } from "@/features/stage3/advance-stage3-turn";

/**
 * Returns to board and rotates owner — maps old `stage3FinalNextTurn`.
 */
export async function returnToStage3Board() {
  await advanceStage3Turn({ rotateOwner: true });
}
