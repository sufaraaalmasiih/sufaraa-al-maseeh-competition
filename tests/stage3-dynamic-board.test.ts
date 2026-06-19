import { describe, expect, it } from "vitest";
import { buildStage3BoardFields } from "@/features/stage3/stage3-board-data";
import { parseWorkbookRowsToBank } from "@/features/facilitator/question-bank-workbook-parser";

function q(fieldId: string, fieldLabel: string, number: number) {
  return {
    id: `${fieldId}_q${number}`,
    fieldId,
    fieldLabel,
    difficulty: "easy" as const,
    questionNumber: number,
  };
}

describe("buildStage3BoardFields (dynamic board from bank)", () => {
  it("groups by field, keeps custom labels, orders cells by number", () => {
    const fields = buildStage3BoardFields([
      q("c1", "آيات", 2),
      q("c1", "آيات", 1),
      q("c2", "وصايا", 1),
    ]);
    expect(fields).toHaveLength(2);
    expect(fields[0].label).toBe("آيات");
    expect(fields[0].questions.map((entry) => entry.number)).toEqual([1, 2]);
    expect(fields[1].label).toBe("وصايا");
  });

  it("caps the board at 6 fields", () => {
    const many = Array.from({ length: 8 }, (_, index) => q(`c${index}`, `مجال ${index}`, 1));
    expect(buildStage3BoardFields(many)).toHaveLength(6);
  });
});

function stage3Row(id: string, category: string) {
  return {
    id,
    stage: "stage3",
    type: "fill_blank",
    category,
    level: "easy",
    question: `سؤال ${id}`,
    correct: "إجابة",
  };
}

describe("parser supports custom stage-3 category names (up to 6)", () => {
  it("uses the raw category text as the field label", () => {
    const bank = parseWorkbookRowsToBank([stage3Row("a_q1", "اسم مخصّص")]);
    const question = bank.stage3["a_q1"];
    expect(question.fieldLabel).toBe("اسم مخصّص");
  });

  it("allows six distinct custom categories but drops a seventh", () => {
    const rows = Array.from({ length: 7 }, (_, index) =>
      stage3Row(`q${index}_q1`, `مجال رقم ${index}`),
    );
    const bank = parseWorkbookRowsToBank(rows);
    const distinctFields = new Set(
      Object.values(bank.stage3).map((question) => question.fieldId),
    );
    expect(distinctFields.size).toBe(6);
  });
});
