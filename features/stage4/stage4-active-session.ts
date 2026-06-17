import { parseActiveQuestionIndices } from "@/features/facilitator/question-display-settings";

let activeIndices: number[] | null = null;

export function syncStage4ActiveSession(data: Record<string, unknown> | undefined): void {
  activeIndices = parseActiveQuestionIndices(data?.stage4ActiveQuestionIndices);
}

export function resolveStage4BankIndex(logicalIndex: number): number {
  if (activeIndices && logicalIndex >= 0 && logicalIndex < activeIndices.length) {
    return activeIndices[logicalIndex];
  }
  return logicalIndex;
}
