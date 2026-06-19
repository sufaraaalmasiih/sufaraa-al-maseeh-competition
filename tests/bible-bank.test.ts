import { describe, expect, it } from "vitest";
import { BIBLE_BANK_ALL_ROWS } from "../data/bible-questions-bank";
import { validateQuestionBankRows } from "@/features/facilitator/question-bank-workbook-validation";
import { parseWorkbookRowsToBank } from "@/features/facilitator/question-bank-workbook-parser";

const KEYS = [
  "id", "stage", "stageName", "type", "typeName", "category", "level", "question", "data",
  "option1", "option2", "option3", "option4", "correct", "acceptedAnswers", "points",
  "imageUrl", "videoUrl", "targetPart", "notes",
];

function toRowObjects() {
  return BIBLE_BANK_ALL_ROWS.map((arr) => {
    const obj: Record<string, unknown> = {};
    KEYS.forEach((key, index) => {
      obj[key.toLowerCase()] = arr[index] ?? "";
    });
    return obj;
  });
}

describe("Bible question bank (150 questions)", () => {
  const rows = toRowObjects();

  it("has the requested per-stage distribution (60 / 40 / 30 / 20)", () => {
    const count = (stage: string) => BIBLE_BANK_ALL_ROWS.filter((r) => r[1] === stage).length;
    expect(count("stage1")).toBe(60);
    expect(count("stage2")).toBe(40);
    expect(count("stage3")).toBe(30);
    expect(count("stage4")).toBe(20);
  });

  it("passes validation with ZERO errors (imports cleanly)", () => {
    const report = validateQuestionBankRows(rows);
    expect(report.errors).toHaveLength(0);
    expect(report.valid).toBe(true);
  });

  it("parses into a complete typed bank", () => {
    const bank = parseWorkbookRowsToBank(rows);
    expect(bank.stage1).toHaveLength(60);
    expect(bank.stage2.arrangeVerse).toHaveLength(10);
    expect(bank.stage2.completeVerse).toHaveLength(10);
    expect(bank.stage2.trueFalseCorrect).toHaveLength(10);
    expect(bank.stage2.matching.length).toBeGreaterThanOrEqual(2);
    expect(Object.keys(bank.stage3)).toHaveLength(30);
    expect(bank.stage4).toHaveLength(20);
  });
});
