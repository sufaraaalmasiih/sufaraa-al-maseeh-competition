import { startStage3OfficialFlow } from "@/features/stage3/start-stage3-official-flow";

/** @deprecated Use startStage3OfficialFlow — kept for backward compatibility */
export async function startStage3Choosing() {
  return startStage3OfficialFlow();
}
