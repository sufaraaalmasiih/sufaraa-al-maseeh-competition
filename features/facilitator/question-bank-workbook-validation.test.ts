import { describe, expect, it } from "vitest";
import { validateQuestionBankRows } from "@/features/facilitator/question-bank-workbook-validation";

describe("validateQuestionBankRows duplicates", () => {
  it("rejects duplicated multiple-choice options", () => {
    const report = validateQuestionBankRows([
      {
        id: "s1-q1",
        stage: "stage1",
        type: "multiple_choice",
        question: "سؤال",
        correct: "بطرس",
        option1: "بطرس",
        option2: "يوحنا",
        option3: "بطرس",
      },
    ]);

    expect(report.valid).toBe(false);
    expect(report.errors.some((error) => error.message.includes("مكرر"))).toBe(true);
  });

  it("rejects duplicated matching right-side text in the same group", () => {
    const report = validateQuestionBankRows([
      {
        id: "match-1",
        stage: "stage2",
        type: "matching",
        question: "الأول",
        correct: "الإجابة",
      },
      {
        id: "match-2",
        stage: "stage2",
        type: "matching",
        question: "الثاني",
        correct: "الإجابة",
      },
    ]);

    expect(report.valid).toBe(false);
    expect(report.errors.some((error) => error.field === "الإجابة الصحيحة")).toBe(true);
  });
});
