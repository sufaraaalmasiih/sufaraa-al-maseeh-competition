import { getActiveStage1Bank } from "@/features/facilitator/stage1-question-bank-store";
import {
  getStage1ActiveIndices,
  resolveStage1BankIndex,
} from "@/features/stage1/stage1-active-session";
import type { Stage1MockQuestion } from "@/features/stage1/stage1-types";

/**
 * Stage 1 question bank accessor.
 * Reads the Firestore-managed bank (imported/edited from the facilitator panel)
 * when present, falling back to the static dev mock bank otherwise.
 * Active questions per run come from gameFlow.stage1ActiveQuestionIndices
 * (built when the facilitator starts the stage from settings).
 */
export function getStage1QuestionBank(): readonly Stage1MockQuestion[] {
  return getActiveStage1Bank();
}

/** Questions available this competition run (from facilitator display settings). */
export function getStage1QuestionCount(): number {
  const active = getStage1ActiveIndices();
  if (active) {
    return active.length;
  }
  return getStage1QuestionBank().length;
}

export function getStage1Question(index: number): Stage1MockQuestion | undefined {
  const bank = getStage1QuestionBank();
  const bankIndex = resolveStage1BankIndex(index);
  if (bankIndex < 0 || bankIndex >= bank.length) {
    return undefined;
  }
  return bank[bankIndex];
}

export function isStage1BankComplete(questionIndex: number): boolean {
  return questionIndex >= getStage1QuestionCount();
}
