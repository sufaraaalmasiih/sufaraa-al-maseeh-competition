import { describe, expect, it } from "vitest";
import type { Stage1MockQuestion } from "@/features/stage1/stage1-types";
import type { Stage4QuestionMetadata } from "@/features/stage4/stage4-question-types";
import {
  sanitizeStage1BankForTeam,
  sanitizeStage2BankForTeam,
  sanitizeStage3BankForTeam,
  sanitizeStage4BankForTeam,
} from "@/lib/sanitize-question-bank";

function makeStage1Bank(count: number): Stage1MockQuestion[] {
  return Array.from({ length: count }, (_, index) => {
    const id = `q-${index}`;
    if (index % 3 === 0) {
      return {
        id,
        type: "arrange" as const,
        prompt: `رتّب ${index}`,
        parts: ["أ", "ب", "ج"],
        correctOrder: ["أ", "ب", "ج"],
        correctAnswer: "أ | ب | ج",
      };
    }
    if (index % 3 === 1) {
      return {
        id,
        type: "multiple_choice" as const,
        prompt: `اختر ${index}`,
        options: ["أ", "ب", "ج"],
        correctAnswer: "أ",
      };
    }
    return {
      id,
      type: "fill_blank" as const,
      prompt: `أكمل ${index}`,
      correctAnswer: "جواب",
    };
  });
}

describe("sanitize question banks at scale", () => {
  it("strips stage1 answers from a large bank quickly", () => {
    const bank = makeStage1Bank(240);
    const started = performance.now();
    const sanitized = sanitizeStage1BankForTeam(bank);
    const elapsed = performance.now() - started;

    expect(sanitized).toHaveLength(240);
    expect(sanitized.every((question) => question.correctAnswer === "")).toBe(true);
    expect(
      sanitized
        .filter((question) => question.type === "arrange")
        .every((question) => question.correctOrder?.length === 0),
    ).toBe(true);
    expect(elapsed).toBeLessThan(500);
  });

  it("sanitizes stage2-4 banks without throwing on large payloads", () => {
    const stage2 = sanitizeStage2BankForTeam({
      matching: Array.from({ length: 40 }, (_, index) => ({
        id: `m-${index}`,
        prompt: "طابق",
        reference: "مرجع",
        pairs: [{ left: "أ", correctRight: "1" }],
        rightOptions: ["1"],
      })),
      arrangeVerse: [],
      completeVerse: [],
      trueFalseCorrect: [],
    });
    const stage3 = sanitizeStage3BankForTeam(
      Object.fromEntries(
        makeStage1Bank(80).map((question) => [
          question.id,
          {
            ...question,
            fieldId: "field-1",
            fieldLabel: "مجال",
            difficulty: "easy" as const,
            questionNumber: 1,
          },
        ]),
      ),
    );
    const stage4 = sanitizeStage4BankForTeam(
      Array.from({ length: 40 }, (_, index) => ({
        id: `s4-${index}`,
        type: "fill_blank" as const,
        prompt: `سؤال ${index}`,
        order: index + 1,
        correctAnswer: "x",
        acceptedAnswers: ["x"],
      })) satisfies Stage4QuestionMetadata[],
    );

    expect(stage2.matching[0]?.pairs[0]?.correctRight).toBe("");
    expect(stage3["q-0"]?.correctAnswer).toBe("");
    expect(stage4[0]?.correctAnswer).toBe("");
  });
});
