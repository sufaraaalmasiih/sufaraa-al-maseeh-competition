import { describe, expect, it } from "vitest";
import { parseStage1Questions } from "@/features/facilitator/stage1-question-bank-parser";
import type { Stage1ArrangeQuestion } from "@/features/stage1/stage1-types";

describe("parseStage1Questions arrange", () => {
  it("always sets correctOrder explicitly from parts when order column is empty", () => {
    const [question] = parseStage1Questions([
      {
        id: "arrange-1",
        type: "arrange",
        prompt: "رتّب",
        parts: ["ج", "ب", "أ"],
        correctAnswer: "",
      },
    ]);

    expect(question?.type).toBe("arrange");
    expect((question as Stage1ArrangeQuestion).correctOrder).toEqual(["ج", "ب", "أ"]);
    expect(question?.correctAnswer).toBe("ج | ب | أ");
  });

  it("prefers explicit correctOrder column when provided", () => {
    const [question] = parseStage1Questions([
      {
        id: "arrange-2",
        type: "arrange",
        prompt: "رتّب",
        parts: ["ج", "ب", "أ"],
        correctOrder: ["أ", "ب", "ج"],
      },
    ]);

    expect((question as Stage1ArrangeQuestion).correctOrder).toEqual(["أ", "ب", "ج"]);
    expect(question?.correctAnswer).toBe("أ | ب | ج");
  });
});
