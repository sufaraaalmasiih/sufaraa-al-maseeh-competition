import { describe, expect, it } from "vitest";
import { validateQuestionBankRows } from "@/features/facilitator/question-bank-workbook-validation";

function arrangeRow(parts: string[]) {
  return {
    id: "av_q1",
    stage: "stage2",
    type: "arrangeVerse",
    question: "رتّب الآية",
    data: parts.join(" | "),
    correct: parts.join(" | "),
  };
}

describe("stage2 arrangeVerse max-5-parts rule", () => {
  it("accepts an arrange verse with 5 parts", () => {
    const report = validateQuestionBankRows([arrangeRow(["أ", "ب", "ج", "د", "هـ"])]);
    expect(report.errors).toHaveLength(0);
  });

  it("rejects an arrange verse with more than 5 parts", () => {
    const report = validateQuestionBankRows([arrangeRow(["أ", "ب", "ج", "د", "هـ", "و"])]);
    expect(report.errors.some((error) => error.field === "المعطيات")).toBe(true);
  });
});
