import { normalizeStage1AnswerText } from "@/features/stage1/stage1-answer-validation";

export function normalizeStage2AnswerText(value: string): string {
  return normalizeStage1AnswerText(value);
}

export function stage2AnswersMatch(submitted: string, expected: string): boolean {
  return normalizeStage2AnswerText(submitted) === normalizeStage2AnswerText(expected);
}
