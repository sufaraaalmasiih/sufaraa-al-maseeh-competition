import { describe, expect, it } from "vitest";
import {
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
});
