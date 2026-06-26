import { describe, expect, it } from "vitest";
import {
  clampSettingsToBankSizes,
  deriveCurrentBankSizes,
} from "@/features/facilitator/question-bank-meta";
import type { QuestionDisplaySettings } from "@/features/facilitator/question-display-settings";

describe("question bank meta", () => {
  it("derives live bank sizes from stored stage documents", () => {
    const current = deriveCurrentBankSizes({
      stage1Questions: [{ id: "s1-1" }, { id: "s1-2" }],
      stage2Data: {
        matching: [
          { id: "m1", pairs: [{ left: "a" }, { left: "b" }] },
          { id: "m2", pairs: [{ left: "c" }] },
        ],
        arrangeVerse: [{ id: "a1" }],
        completeVerse: [{ id: "c1" }, { id: "c2" }],
        trueFalseCorrect: [{ id: "t1" }],
      },
      stage3Questions: { q1: {}, q2: {}, q3: {} },
      stage4Questions: [{ id: "s4-1" }],
    });

    expect(current.bankSizes).toEqual({
      stage1: 2,
      stage2: 7,
      stage3: 3,
      stage4: 1,
    });
    expect(current.stage2FieldSizes).toEqual({
      matching: 2,
      arrangeVerse: 1,
      completeVerse: 2,
      trueFalseCorrect: 1,
    });
    expect(current.stage2MatchingPairCount).toBe(3);
  });

  it("clamps display settings and stage 2 field settings to the live bank", () => {
    const settings: QuestionDisplaySettings = {
      stage1: { displayCount: 50, orderMode: "random" },
      stage2: { displayCount: 40, orderMode: "order" },
      stage3: { displayCount: 30, orderMode: "order" },
      stage4: { displayCount: 15, orderMode: "random" },
      stage2Fields: {
        matching: 5,
        arrangeVerse: 5,
        completeVerse: 5,
        trueFalseCorrect: 5,
      },
    };

    const clamped = clampSettingsToBankSizes(
      settings,
      { stage1: 12, stage2: 8, stage3: 9, stage4: 4 },
      { matching: 2, arrangeVerse: 3, completeVerse: 1, trueFalseCorrect: 0 },
    );

    expect(clamped.stage1.displayCount).toBe(12);
    expect(clamped.stage2.displayCount).toBe(8);
    expect(clamped.stage3.displayCount).toBe(9);
    expect(clamped.stage4.displayCount).toBe(4);
    expect(clamped.stage2Fields).toEqual({
      matching: 2,
      arrangeVerse: 3,
      completeVerse: 1,
      trueFalseCorrect: 0,
    });
  });
});
