import { describe, expect, it } from "vitest";
import { isStage1ArrangeOrderCorrect } from "@/features/stage1/stage1-arrange";
import { isStage2ArrangeOrderCorrect } from "@/features/stage2/stage2-arrange";
import { resolveArrangeCorrectOrder } from "@/lib/arrange-order-resolve";

describe("resolveArrangeCorrectOrder", () => {
  it("falls back when correctOrder is empty array", () => {
    expect(resolveArrangeCorrectOrder([], ["أ", "ب", "ج"])).toEqual(["أ", "ب", "ج"]);
  });

  it("prefers correctOrder when long enough", () => {
    expect(resolveArrangeCorrectOrder(["ج", "ب", "أ"], ["أ", "ب"])).toEqual(["ج", "ب", "أ"]);
  });
});

describe("isStage1ArrangeOrderCorrect", () => {
  const question = {
    id: "q1",
    type: "arrange" as const,
    prompt: "رتّب",
    parts: ["ب", "أ", "ج"],
    correctOrder: ["أ", "ب", "ج"],
    correctAnswer: "أ | ب | ج",
  };

  it("accepts correct pipe-separated order", () => {
    expect(isStage1ArrangeOrderCorrect("أ | ب | ج", question)).toBe(true);
  });

  it("rejects reversed order", () => {
    expect(isStage1ArrangeOrderCorrect("ج | ب | أ", question)).toBe(false);
  });
});

describe("isStage2ArrangeOrderCorrect", () => {
  it("uses fragments fallback when correctOrder is empty", () => {
    expect(
      isStage2ArrangeOrderCorrect(["و", "نور"], [], ["و", "نور"]),
    ).toBe(true);
  });
});
