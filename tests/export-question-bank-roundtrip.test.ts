import { describe, expect, it } from "vitest";
import { buildBankExportRows } from "@/features/facilitator/export-question-bank-excel";
import { parseWorkbookRowsToBank } from "@/features/facilitator/question-bank-workbook-parser";
import type { FullQuestionBankPayload } from "@/features/facilitator/question-bank-types";

// حمولة صغيرة تغطي كل مرحلة ونوع رئيسي للتأكد من رحلة الذهاب-إياب (تصدير ثم استيراد).
const payload = {
  stage1: [
    {
      id: "s1_q1",
      type: "multiple_choice",
      prompt: "من بنى الفلك؟",
      correctAnswer: "نوح",
      options: ["نوح", "موسى"],
    },
  ],
  stage2: {
    matching: [
      {
        id: "match_group",
        prompt: "وصّل",
        reference: "تكوين",
        pairs: [
          { left: "آدم", correctRight: "أول إنسان" },
          { left: "نوح", correctRight: "الفلك" },
        ],
        rightOptions: ["أول إنسان", "الفلك"],
      },
    ],
    arrangeVerse: [
      {
        id: "av_q1",
        prompt: "رتّب",
        fragments: ["في", "البدء", "خلق"],
        correctOrder: ["في", "البدء", "خلق"],
        reference: "تكوين 1",
      },
    ],
    completeVerse: [
      {
        id: "cv_q1",
        prompt: "أكمل",
        verseWithBlank: "في البدء ___ الله",
        correctAnswer: "خلق",
        reference: "تكوين 1:1",
      },
    ],
    trueFalseCorrect: [
      {
        id: "tf_q1",
        statement: "موسى بنى الفلك",
        correctIsTrue: false,
        expectedCorrection: "نوح",
        reference: "تكوين",
      },
    ],
  },
  stage3: {
    s3_q1: {
      id: "s3_q1",
      type: "fill_blank",
      prompt: "من قاد الشعب؟",
      correctAnswer: "موسى",
      fieldId: "characters",
      fieldLabel: "شخصيات",
      difficulty: "easy",
      questionNumber: 1,
    },
  },
  stage4: [
    {
      id: "s4_q1",
      type: "multiple_choice",
      prompt: "كم عدد التلاميذ؟",
      correctAnswer: "12",
      options: ["12", "10"],
      order: 1,
    },
  ],
  meta: {
    bankSizes: { stage1: 1, stage2: 4, stage3: 1, stage4: 1 },
    stage2ReadingReference: "يوحنا 15",
    stage2ReadingPassage: "",
  },
} as unknown as FullQuestionBankPayload;

describe("question bank Excel round-trip", () => {
  it("re-imports every stage with no loss of questions", () => {
    const rows = buildBankExportRows(payload);
    const reimported = parseWorkbookRowsToBank(rows);

    expect(reimported.stage1).toHaveLength(1);
    expect(reimported.stage2.matching.length).toBeGreaterThanOrEqual(1);
    expect(reimported.stage2.arrangeVerse).toHaveLength(1);
    expect(reimported.stage2.completeVerse).toHaveLength(1);
    expect(reimported.stage2.trueFalseCorrect).toHaveLength(1);
    expect(Object.keys(reimported.stage3)).toHaveLength(1);
    expect(reimported.stage4).toHaveLength(1);
  });

  it("preserves the matching pairs through the round-trip", () => {
    const rows = buildBankExportRows(payload);
    const reimported = parseWorkbookRowsToBank(rows);
    const totalPairs = reimported.stage2.matching.reduce(
      (sum, question) => sum + question.pairs.length,
      0,
    );
    expect(totalPairs).toBe(2);
  });

  it("preserves the true/false correction answer", () => {
    const rows = buildBankExportRows(payload);
    const reimported = parseWorkbookRowsToBank(rows);
    expect(reimported.stage2.trueFalseCorrect[0].correctIsTrue).toBe(false);
  });
});
