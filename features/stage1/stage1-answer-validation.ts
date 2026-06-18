import { STAGE1_ARRANGE_ANSWER_SEPARATOR } from "@/features/stage1/stage1-constants";
import type { Stage1MockQuestion } from "@/features/stage1/stage1-types";
import { isStage1ArrangeOrderCorrect } from "@/features/stage1/stage1-arrange";

/**
 * Arabic answer normalization (old project: normalizeText / norm).
 * - trim
 * - strip diacritics
 * - unify alef / ta marbuta / alef maksura
 * - collapse whitespace and common separators
 */
export function normalizeStage1AnswerText(value: string): string {
  return String(value ?? "")
    .trim()
    .replace(/[ًٌٍَُِّْـ]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/[\s|،,؛;\-–—_]+/g, " ")
    .trim()
    .toLowerCase();
}

export function stage1AnswersMatch(submitted: string, expected: string): boolean {
  return normalizeStage1AnswerText(submitted) === normalizeStage1AnswerText(expected);
}

export function evaluateStage1Answer(
  question: Stage1MockQuestion,
  answer: string,
): boolean {
  if (question.type === "arrange") {
    return isStage1ArrangeOrderCorrect(answer, question);
  }

  return stage1AnswersMatch(answer, question.correctAnswer);
}
