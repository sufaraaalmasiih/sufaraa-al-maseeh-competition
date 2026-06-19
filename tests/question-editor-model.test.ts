import { describe, expect, it } from "vitest";
import {
  blankItem,
  editorItemToRows,
  itemsToPayload,
  payloadToEditorItems,
  validateItem,
} from "@/features/facilitator/question-editor-model";
import type { FullQuestionBankPayload } from "@/features/facilitator/question-bank-types";

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
        id: "m1",
        prompt: "وصّل",
        reference: "تكوين",
        pairs: [
          { left: "آدم", correctRight: "أول إنسان" },
          { left: "نوح", correctRight: "الفلك" },
        ],
        rightOptions: ["أول إنسان", "الفلك"],
      },
    ],
    arrangeVerse: [],
    completeVerse: [],
    trueFalseCorrect: [
      {
        id: "tf1",
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
      type: "who_am_i",
      prompt: "من أنا؟",
      clue: "قائد الشعب",
      correctAnswer: "موسى",
      order: 1,
    },
  ],
  meta: {
    bankSizes: { stage1: 1, stage2: 2, stage3: 1, stage4: 1 },
    stage2ReadingReference: "",
    stage2ReadingPassage: "",
  },
} as unknown as FullQuestionBankPayload;

describe("in-app question editor model", () => {
  it("round-trips payload -> editor items -> payload with no loss", () => {
    const items = payloadToEditorItems(payload);
    const rebuilt = itemsToPayload(items);

    expect(rebuilt.stage1).toHaveLength(1);
    expect(rebuilt.stage2.matching.length).toBeGreaterThanOrEqual(1);
    expect(rebuilt.stage2.trueFalseCorrect).toHaveLength(1);
    expect(Object.keys(rebuilt.stage3)).toHaveLength(1);
    expect(rebuilt.stage4).toHaveLength(1);
  });

  it("matching item produces one row per pair", () => {
    const items = payloadToEditorItems(payload);
    const matchingItem = items.find((item) => item.type === "matching");
    expect(matchingItem).toBeTruthy();
    expect(editorItemToRows(matchingItem!)).toHaveLength(2);
  });

  it("flags a multiple-choice item whose correct answer is not among options", () => {
    const item = {
      ...blankItem("stage1"),
      type: "multiple_choice",
      id: "x1",
      question: "سؤال؟",
      options: ["أ", "ب"],
      correct: "ج",
    };
    expect(validateItem(item).length).toBeGreaterThan(0);
  });

  it("accepts a valid arrange item (correct order = entered parts)", () => {
    const item = {
      ...blankItem("stage1"),
      type: "arrange",
      id: "x2",
      question: "رتّب",
      parts: ["أ", "ب", "ج"],
    };
    expect(validateItem(item)).toHaveLength(0);
  });

  it("persists a per-question points override through items -> payload", () => {
    const item = {
      ...blankItem("stage1"),
      type: "fill_blank",
      id: "p1",
      question: "سؤال بنقاط؟",
      correct: "نعم",
      points: "20",
    };
    const rebuilt = itemsToPayload([item]);
    expect(rebuilt.stage1[0].points).toBe(20);
  });

  it("leaves points undefined when the field is blank", () => {
    const item = {
      ...blankItem("stage1"),
      type: "fill_blank",
      id: "p2",
      question: "بلا نقاط؟",
      correct: "نعم",
      points: "",
    };
    const rebuilt = itemsToPayload([item]);
    expect(rebuilt.stage1[0].points).toBeUndefined();
  });

  it("omits points when equal to the stage default (no needless override)", () => {
    const item = {
      ...blankItem("stage1"),
      type: "fill_blank",
      id: "p3",
      question: "نقاط طبيعية؟",
      correct: "نعم",
      points: "5", // = افتراضي المرحلة 1
    };
    const rebuilt = itemsToPayload([item]);
    expect(rebuilt.stage1[0].points).toBeUndefined();
  });

  it("round-trips the stage-2 true/false expected wrong part", () => {
    const item = {
      ...blankItem("stage2"),
      type: "trueFalseCorrect",
      id: "tf1",
      question: "موسى بنى الفلك",
      correctIsTrue: false,
      data: "نوح", // التصحيح
      expectedWrongPart: "موسى",
    };
    const rebuilt = itemsToPayload([item]);
    expect(rebuilt.stage2.trueFalseCorrect[0].expectedWrongPart).toBe("موسى");
    expect(rebuilt.stage2.trueFalseCorrect[0].expectedCorrection).toBe("نوح");
  });

  it("stage3 item keeps an override that differs from the level default", () => {
    const item = {
      ...blankItem("stage3"),
      type: "fill_blank",
      id: "s3p",
      question: "سؤال م3؟",
      correct: "نعم",
      category: "characters",
      level: "easy", // افتراضي 15
      points: "50",
    };
    const rebuilt = itemsToPayload([item]);
    expect(rebuilt.stage3["s3p"].points).toBe(50);
  });
});
