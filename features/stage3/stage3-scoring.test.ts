import { describe, expect, it } from "vitest";
import {
  computeStage3PointsDelta,
  getStage3LeftoverCount,
  isStage3CollectiveSelection,
  resolveStage3AnswerOutcome,
} from "@/features/stage3/stage3-scoring";

describe("stage3-scoring", () => {
  describe("computeStage3PointsDelta", () => {
    it("awards owner correct points by difficulty", () => {
      expect(computeStage3PointsDelta(true, "easy", "correct")).toBe(15);
      expect(computeStage3PointsDelta(true, "medium", "correct")).toBe(30);
      expect(computeStage3PointsDelta(true, "hard", "correct")).toBe(45);
    });

    it("applies a per-question points override on correct answers (owner full, others a third)", () => {
      expect(computeStage3PointsDelta(true, "easy", "correct", false, 60)).toBe(60);
      expect(computeStage3PointsDelta(false, "easy", "correct", false, 60)).toBe(20);
      // collective uses the shared (other) share
      expect(computeStage3PointsDelta(true, "hard", "correct", true, 60)).toBe(20);
    });

    it("ignores the override for non-correct outcomes (penalties stay by level)", () => {
      expect(computeStage3PointsDelta(true, "hard", "wrong", false, 60)).toBe(-15);
      expect(computeStage3PointsDelta(true, "easy", "no_answer", false, 60)).toBe(-5);
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

  describe("collective (leftover) questions — point 15", () => {
    it("flat scoring for everyone, no owner advantage", () => {
      // owner on a collective question scores like any other team
      expect(computeStage3PointsDelta(true, "hard", "correct", true)).toBe(15);
      expect(computeStage3PointsDelta(false, "hard", "correct", true)).toBe(15);
    });

    it("allows owner to pass on a collective question without throwing", () => {
      expect(computeStage3PointsDelta(true, "easy", "pass", true)).toBe(0);
    });

    it("computes leftover count (questions not divisible by teams)", () => {
      expect(getStage3LeftoverCount(25, 4)).toBe(1);
      expect(getStage3LeftoverCount(24, 4)).toBe(0);
      expect(getStage3LeftoverCount(30, 4)).toBe(2);
      expect(getStage3LeftoverCount(10, 0)).toBe(0);
    });

    it("marks the final leftover questions as collective", () => {
      // 25 questions / 4 teams -> leftover 1 -> only the 25th (index 24) is collective
      expect(isStage3CollectiveSelection(24, 25, 4)).toBe(true);
      expect(isStage3CollectiveSelection(23, 25, 4)).toBe(false);
      // perfectly divisible -> none collective
      expect(isStage3CollectiveSelection(23, 24, 4)).toBe(false);
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
