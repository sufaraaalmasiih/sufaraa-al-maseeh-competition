import { parseActiveQuestionIndices } from "@/features/facilitator/question-display-settings";

let activeIndices: number[] | null = null;

export function syncStage1ActiveSession(data: Record<string, unknown> | undefined): void {
  activeIndices = parseActiveQuestionIndices(data?.stage1ActiveQuestionIndices);
}

export function getStage1ActiveIndices(): number[] | null {
  return activeIndices;
}

export function resolveStage1BankIndex(logicalIndex: number): number {
  if (activeIndices && logicalIndex >= 0 && logicalIndex < activeIndices.length) {
    return activeIndices[logicalIndex];
  }
  return logicalIndex;
}
