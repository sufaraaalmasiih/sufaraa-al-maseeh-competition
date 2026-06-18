import { STAGE1_ARRANGE_ANSWER_SEPARATOR } from "@/features/stage1/stage1-constants";
import type { Stage1ArrangeQuestion } from "@/features/stage1/stage1-types";
import { normalizeStage1AnswerText } from "@/features/stage1/stage1-answer-validation";

function hashSeed(seed: string): number {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) | 0;
  }
  return Math.abs(hash);
}

/** Seeded shuffle (old project: seededShuffle for stable per-team order). */
export function seededShuffleStage1Parts<T>(items: T[], seed: string): T[] {
  const shuffled = [...items];
  let state = hashSeed(seed);

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    const swapIndex = state % (index + 1);
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  return shuffled;
}

export function getStage1ArrangeCorrectOrder(question: Stage1ArrangeQuestion): string[] {
  if (Array.isArray(question.correctOrder) && question.correctOrder.length > 0) {
    return question.correctOrder.map(String);
  }

  return question.parts.map(String);
}

export function getStage1ArrangeExpectedAnswer(question: Stage1ArrangeQuestion): string {
  return getStage1ArrangeCorrectOrder(question).join(STAGE1_ARRANGE_ANSWER_SEPARATOR);
}

export function formatStage1ArrangeSubmission(picked: string[]): string {
  return picked.join(STAGE1_ARRANGE_ANSWER_SEPARATOR);
}

export function splitStage1ArrangeAnswer(answer: string): string[] {
  return String(answer ?? "")
    .split(STAGE1_ARRANGE_ANSWER_SEPARATOR)
    .map((part) => part.trim())
    .filter(Boolean);
}

export function isStage1ArrangeOrderCorrect(
  submittedAnswer: string,
  question: Stage1ArrangeQuestion,
): boolean {
  const expected = getStage1ArrangeCorrectOrder(question);
  const submitted = splitStage1ArrangeAnswer(submittedAnswer);

  if (submitted.length !== expected.length) {
    return false;
  }

  return submitted.every(
    (part, index) =>
      normalizeStage1AnswerText(part) === normalizeStage1AnswerText(expected[index] ?? ""),
  );
}

export function getStage1ArrangeDisplayParts(
  question: Stage1ArrangeQuestion,
  shuffleSeed: string,
): string[] {
  const order = getStage1ArrangeCorrectOrder(question);
  return seededShuffleStage1Parts(order, shuffleSeed);
}
