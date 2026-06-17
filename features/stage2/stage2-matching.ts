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

export function areAllMatchingPairsFilled(
  question: Stage2MatchingQuestion,
  pairings: Stage2MatchingPairings,
): boolean {
  return question.pairs.every((pair) => Boolean(pairings[pair.left]));
}

/** Right-column pool for team UI — must not rely on stripped `correctRight`. */
export function getShuffledMatchingRightOptions(
  question: Stage2MatchingQuestion,
): string[] {
  const fromBank = (question.rightOptions ?? []).map((option) => option.trim()).filter(Boolean);
  const fromPairs = question.pairs
    .map((pair) => pair.correctRight.trim())
    .filter(Boolean);
  const pool = fromBank.length > 0 ? fromBank : fromPairs;

  return seededShuffleStage1Parts(pool, `${question.id}-right`);
}
