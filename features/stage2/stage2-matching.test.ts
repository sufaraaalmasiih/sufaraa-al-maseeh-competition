import { describe, expect, it } from "vitest";
import {
  countCorrectMatchingPairs,
  getMatchingRightAnswers,
  getShuffledMatchingRightOptions,
} from "@/features/stage2/stage2-matching";
import { stage2MatchingMockQuestions } from "@/features/stage2/stage2-matching-mock-questions";

describe("stage2-matching", () => {
  it("uses exactly one right answer per left pair", () => {
    const question = stage2MatchingMockQuestions[0];
    const answers = getMatchingRightAnswers(question);

    expect(answers).toHaveLength(5);
    expect(new Set(answers).size).toBe(5);
  });

  it("falls back to rightOptions when correctRight is stripped for team playback", () => {
    const question = {
      ...stage2MatchingMockQuestions[0],
      pairs: stage2MatchingMockQuestions[0].pairs.map((pair) => ({
        ...pair,
        correctRight: "",
      })),
    };
    const answers = getMatchingRightAnswers(question);

    expect(answers).toHaveLength(5);
    expect(new Set(answers)).toEqual(new Set(stage2MatchingMockQuestions[0].rightOptions));
  });
  it("shuffles without adding distractors", () => {
    const question = stage2MatchingMockQuestions[0];
    const shuffled = getShuffledMatchingRightOptions(question);

    expect(shuffled).toHaveLength(5);
    expect(new Set(shuffled)).toEqual(new Set(getMatchingRightAnswers(question)));
  });

  describe("countCorrectMatchingPairs (per-pair scoring)", () => {
    const question = stage2MatchingMockQuestions[0];

    function correctPairings() {
      return Object.fromEntries(
        question.pairs.map((pair) => [pair.left, pair.correctRight]),
      );
    }

    it("counts every pair when all are correct", () => {
      expect(countCorrectMatchingPairs(question, correctPairings())).toBe(
        question.pairs.length,
      );
    });

    it("counts only the correctly matched pairs", () => {
      const pairings = correctPairings();
      pairings[question.pairs[0].left] = "إجابة خاطئة";
      pairings[question.pairs[1].left] = "إجابة خاطئة";
      expect(countCorrectMatchingPairs(question, pairings)).toBe(
        question.pairs.length - 2,
      );
    });

    it("counts zero when nothing matches", () => {
      const pairings = Object.fromEntries(
        question.pairs.map((pair) => [pair.left, "لا شيء"]),
      );
      expect(countCorrectMatchingPairs(question, pairings)).toBe(0);
    });
  });
});
