import { seededShuffleStage1Parts } from "@/features/stage1/stage1-arrange";
import { normalizeStage1AnswerText } from "@/features/stage1/stage1-answer-validation";
import { resolveArrangeCorrectOrder } from "@/lib/arrange-order-resolve";

export function getStage2ArrangeDisplayFragments(
  fragments: string[],
  shuffleSeed: string,
): string[] {
  return seededShuffleStage1Parts([...fragments], shuffleSeed);
}

export function isStage2ArrangeOrderCorrect(
  orderedFragments: string[],
  correctOrder: string[],
  fallbackFragments: string[] = [],
): boolean {
  const expected = resolveArrangeCorrectOrder(correctOrder, fallbackFragments);

  if (orderedFragments.length !== expected.length || expected.length < 2) {
    return false;
  }

  return orderedFragments.every(
    (fragment, index) =>
      normalizeStage1AnswerText(fragment) ===
      normalizeStage1AnswerText(expected[index] ?? ""),
  );
}
