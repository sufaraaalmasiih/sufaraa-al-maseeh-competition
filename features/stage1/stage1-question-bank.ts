import { STAGE1_OFFICIAL_MAX_QUESTIONS } from "@/features/stage1/stage1-constants";
import { getActiveStage1Bank } from "@/features/facilitator/stage1-question-bank-store";
import type { Stage1MockQuestion } from "@/features/stage1/stage1-types";

/**
 * Stage 1 question bank accessor.
 * Reads the Firestore-managed bank (imported/edited from the facilitator panel)
 * when present, falling back to the static dev mock bank otherwise.
 * Active count is min(bank.length, official max) so a 50-row import works without code changes.
 */
export function getStage1QuestionBank(): readonly Stage1MockQuestion[] {
  return getActiveStage1Bank();
}

/** Questions available this competition run (capped at official max). */
export function getStage1QuestionCount(): number {
  return Math.min(STAGE1_OFFICIAL_MAX_QUESTIONS, getStage1QuestionBank().length);
}

export function getStage1Question(index: number): Stage1MockQuestion | undefined {
  const bank = getStage1QuestionBank();
  if (index < 0 || index >= bank.length) {
    return undefined;
  }
  return bank[index];
}

export function isStage1BankComplete(questionIndex: number): boolean {
  return questionIndex >= getStage1QuestionCount();
}
