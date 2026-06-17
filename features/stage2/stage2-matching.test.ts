import { describe, expect, it } from "vitest";
import { sanitizeStage2BankForTeam } from "@/lib/sanitize-question-bank";
import { stage2MatchingMockQuestions } from "@/features/stage2/stage2-matching-mock-questions";
import { getShuffledMatchingRightOptions } from "@/features/stage2/stage2-matching";

describe("getShuffledMatchingRightOptions", () => {
  it("uses rightOptions when correctRight is stripped for team playback", () => {
    const [question] = sanitizeStage2BankForTeam({
      matching: stage2MatchingMockQuestions,
      arrangeVerse: [],
      completeVerse: [],
      trueFalseCorrect: [],
    }).matching;

    const options = getShuffledMatchingRightOptions(question);

    expect(options.length).toBeGreaterThan(0);
    expect(options.every((option) => option.trim().length > 0)).toBe(true);
    expect(options).toContain("أبي الكرام");
    expect(options).toContain("الكرمة");
  });
});
