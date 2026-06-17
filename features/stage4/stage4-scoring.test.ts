import { describe, expect, it } from "vitest";
import {
  computeStage4NextCorrectPoints,
  computeStage4PointsForCorrect,
  resolveStage4StreakAfterAnswer,
} from "@/features/stage4/stage4-scoring";

describe("stage4-scoring", () => {
  describe("computeStage4PointsForCorrect", () => {
    it("returns 0 for non-positive streak", () => {
      expect(computeStage4PointsForCorrect(0)).toBe(0);
    });

    it("follows Pi = 15 + ((Si - 1) * 2)", () => {
      expect(computeStage4PointsForCorrect(1)).toBe(15);
      expect(computeStage4PointsForCorrect(2)).toBe(17);
      expect(computeStage4PointsForCorrect(5)).toBe(23);
    });
  });

  describe("resolveStage4StreakAfterAnswer", () => {
    it("resets streak on pass or wrong answer", () => {
      expect(resolveStage4StreakAfterAnswer(3, false, false)).toBe(0);
      expect(resolveStage4StreakAfterAnswer(3, true, true)).toBe(0);
    });

    it("increments streak on correct non-pass answer", () => {
      expect(resolveStage4StreakAfterAnswer(2, true, false)).toBe(3);
    });
  });

  describe("computeStage4NextCorrectPoints", () => {
    it("uses streak + 1 for next question value", () => {
      expect(computeStage4NextCorrectPoints(0)).toBe(15);
      expect(computeStage4NextCorrectPoints(2)).toBe(19);
    });
  });
});
