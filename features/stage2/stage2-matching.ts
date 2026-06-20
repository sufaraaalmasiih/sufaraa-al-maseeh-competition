import { seededShuffleStage1Parts } from "@/features/stage1/stage1-arrange";
import {
  STAGE2_MATCHING_PAIR_DELIMITER,
  STAGE2_MATCHING_PAIR_SEPARATOR,
} from "@/features/stage2/stage2-constants";
import type { Stage2MatchingQuestion } from "@/features/stage2/stage2-matching-types";

export type Stage2MatchingPairings = Record<string, string>;

export function serializeMatchingPairings(pairings: Stage2MatchingPairings): string {
  return Object.entries(pairings)
    .map(([left, right]) => `${left}${STAGE2_MATCHING_PAIR_DELIMITER}${right}`)
    .join(STAGE2_MATCHING_PAIR_SEPARATOR);
}

export function evaluateMatchingPairings(
  question: Stage2MatchingQuestion,
  pairings: Stage2MatchingPairings,
): boolean {
  return question.pairs.every((pair) => pairings[pair.left] === pair.correctRight);
}

/** عدد الأزواج الموصولة بشكل صحيح — تُمنح النقاط لكل زوج صحيح على حدة. */
export function countCorrectMatchingPairs(
  question: Stage2MatchingQuestion,
  pairings: Stage2MatchingPairings,
): number {
  return question.pairs.reduce(
    (count, pair) => (pairings[pair.left] === pair.correctRight ? count + 1 : count),
    0,
  );
}

export function areAllMatchingPairsFilled(
  question: Stage2MatchingQuestion,
  pairings: Stage2MatchingPairings,
): boolean {
  return question.pairs.every((pair) => Boolean(pairings[pair.left]));
}

/** Right-column answers: one card per pair (5×5). Uses rightOptions when team bank strips correctRight. */
export function getMatchingRightAnswers(question: Stage2MatchingQuestion): string[] {
  const fromPairs: string[] = [];
  const seen = new Set<string>();

  for (const pair of question.pairs) {
    const right = pair.correctRight.trim();
    if (!right || seen.has(right)) {
      continue;
    }
    seen.add(right);
    fromPairs.push(right);
  }

  if (fromPairs.length > 0) {
    return fromPairs;
  }

  const fromOptions = (question.rightOptions ?? [])
    .map((option) => option.trim())
    .filter(Boolean);
  return [...new Set(fromOptions)];
}

/** Right-column pool for team UI — shuffled correct answers only (no MC distractors). */
export function getShuffledMatchingRightOptions(
  question: Stage2MatchingQuestion,
): string[] {
  const answers = getMatchingRightAnswers(question);
  return seededShuffleStage1Parts(answers, `${question.id}-right`);
}
