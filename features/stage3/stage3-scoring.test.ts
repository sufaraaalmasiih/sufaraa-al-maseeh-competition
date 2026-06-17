import { describe, expect, it } from "vitest";
import {
  computeStage3PointsDelta,
  resolveStage3AnswerOutcome,
} from "@/features/stage3/stage3-scoring";

describe("stage3-scoring", () => {
  describe("computeStage3PointsDelta", () => {
    it("awards owner correct points by difficulty", () => {
      expect(computeStage3PointsDelta(true, "easy", "correct")).toBe(15);
      expect(computeStage3PointsDelta(true, "medium", "correct")).toBe(30);
      expect(computeStage3PointsDelta(true, "hard", "correct")).toBe(45);
    });

    it("penalizes owner wrong and timeout answers", () => {
      expect(computeStage3PointsDelta(true, "medium", "wrong")).toBe(-10);
      expect(computeStage3PointsDelta(true, "hard", "selection_timeout")).toBe(-15);
    });

    it("throws when owner tries to pass", () => {
      expect(() => computeStage3PointsDelta(true, "easy", "pass")).toThrow(
        "Owner team cannot pass.",
      );
    });

    it("awards other teams partial credit without penalty on pass", () => {
      expect(computeStage3PointsDelta(false, "hard", "correct")).toBe(15);
      expect(computeStage3PointsDelta(false, "hard", "pass")).toBe(0);
      expect(computeStage3PointsDelta(false, "medium", "wrong")).toBe(-10);
    });
  });

  describe("resolveStage3AnswerOutcome", () => {
    it("maps pass before correctness", () => {
      expect(resolveStage3AnswerOutcome(true, true)).toBe("pass");
      expect(resolveStage3AnswerOutcome(true, false)).toBe("pass");
    });

    it("maps correct and wrong when not passed", () => {
      expect(resolveStage3AnswerOutcome(false, true)).toBe("correct");
      expect(resolveStage3AnswerOutcome(false, false)).toBe("wrong");
    });
  });
});
