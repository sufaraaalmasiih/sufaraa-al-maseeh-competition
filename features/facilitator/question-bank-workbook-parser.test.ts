import { describe, expect, it } from "vitest";
import {
  buildArchiveCounts,
  countStage2Questions,
  MAX_MATCHING_PAIRS_PER_SCREEN,
  parseWorkbookRowsToBank,
} from "@/features/facilitator/question-bank-workbook-parser";

type Row = Record<string, unknown>;

function matchingRow(base: string, index: number, left: string, right: string): Row {
  return {
    id: `${base}-${index}`,
    stage: "stage2",
    type: "matching",
    question: left,
    correct: right,
  };
}

describe("parseWorkbookRowsToBank — Stage 2 matching rounds (points 5 & 18)", () => {
  it("يقسّم 15 زوجاً إلى 3 جولات × 5", () => {
    const rows: Row[] = Array.from({ length: 15 }, (_, i) =>
      matchingRow("matching_q1", i + 1, `يسار ${i + 1}`, `يمين ${i + 1}`),
    );

    const bank = parseWorkbookRowsToBank(rows);

    expect(bank.stage2.matching).toHaveLength(3);
    bank.stage2.matching.forEach((question) => {
      expect(question.pairs.length).toBeLessThanOrEqual(MAX_MATCHING_PAIRS_PER_SCREEN);
    });
    expect(bank.stage2.matching[0].pairs).toHaveLength(5);
    expect(bank.stage2.matching[2].pairs).toHaveLength(5);
  });

  it("يقسّم 7 أزواج تلقائياً إلى جولة 5 + جولة 2", () => {
    const rows: Row[] = Array.from({ length: 7 }, (_, i) =>
      matchingRow("matching_q2", i + 1, `يسار ${i + 1}`, `يمين ${i + 1}`),
    );

    const bank = parseWorkbookRowsToBank(rows);

    expect(bank.stage2.matching).toHaveLength(2);
    expect(bank.stage2.matching[0].pairs).toHaveLength(5);
    expect(bank.stage2.matching[1].pairs).toHaveLength(2);
    // معرّفات الجولات فريدة
    expect(bank.stage2.matching[0].id).not.toBe(bank.stage2.matching[1].id);
  });

  it("يبقي ≤5 أزواج في جولة واحدة بمعرّف أساسي", () => {
    const rows: Row[] = Array.from({ length: 4 }, (_, i) =>
      matchingRow("matching_q3", i + 1, `يسار ${i + 1}`, `يمين ${i + 1}`),
    );

    const bank = parseWorkbookRowsToBank(rows);

    expect(bank.stage2.matching).toHaveLength(1);
    expect(bank.stage2.matching[0].pairs).toHaveLength(4);
    expect(bank.stage2.matching[0].id).toBe("matching_q3");
  });
});

describe("parseWorkbookRowsToBank — flexible stage routing (point 18)", () => {
  it("يوجّه كل سؤال إلى مرحلته حسب عمود stage", () => {
    const rows: Row[] = [
      { id: "s1", stage: "stage1", type: "fill_blank", question: "املأ الفراغ", correct: "كلمة" },
      ...Array.from({ length: 5 }, (_, i) =>
        matchingRow("m1", i + 1, `يسار ${i + 1}`, `يمين ${i + 1}`),
      ),
      {
        id: "tf1",
        stage: "stage2",
        type: "trueFalseCorrect",
        question: "العبارة صحيحة",
        correct: "صح",
      },
    ];

    const bank = parseWorkbookRowsToBank(rows);

    expect(bank.stage1.length).toBeGreaterThanOrEqual(1);
    expect(bank.stage2.matching).toHaveLength(1);
    expect(bank.stage2.trueFalseCorrect).toHaveLength(1);
    // نقل نفس السؤال بتغيير stage إلى stage1 يخرجه من stage2
    const movedRows = rows.map((row) =>
      row.id === "tf1" ? { ...row, stage: "stage1" } : row,
    );
    const movedBank = parseWorkbookRowsToBank(movedRows);
    expect(movedBank.stage2.trueFalseCorrect).toHaveLength(0);
  });
});

describe("question bank counts", () => {
  it("countStage2Questions يجمع كل أنواع المرحلة الثانية", () => {
    const rows: Row[] = [
      ...Array.from({ length: 7 }, (_, i) =>
        matchingRow("m1", i + 1, `يسار ${i + 1}`, `يمين ${i + 1}`),
      ),
      { id: "tf1", stage: "stage2", type: "trueFalseCorrect", question: "عبارة", correct: "خطأ" },
    ];

    const bank = parseWorkbookRowsToBank(rows);
    // 7 أزواج ⇐ جولتان، + سؤال صح/خطأ = 3
    expect(countStage2Questions(bank.stage2)).toBe(3);
    expect(buildArchiveCounts(bank).stage2).toBe(3);
  });
});
