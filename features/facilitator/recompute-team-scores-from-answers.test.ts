import { describe, expect, it } from "vitest";
import {
  recomputeStageScoresFromAnswers,
  type ScoreAnswerRow,
} from "@/features/facilitator/recompute-team-scores-from-answers";

const rows: ScoreAnswerRow[] = [
  { teamId: "A", stage: "stage1", pointsDelta: 5 },
  { teamId: "A", stage: "stage1", pointsDelta: 5 },
  { teamId: "A", stage: "stage1", pointsDelta: 0 },
  { teamId: "A", stage: "stage2", pointsDelta: 12 },
  { teamId: "A", stage: "stage3", pointsDelta: 45 },
  { teamId: "A", stage: "stage3", pointsDelta: -5 }, // عقوبة عدم اختيار سؤال
  { teamId: "A", stage: "stage4", pointsDelta: 17 },
  { teamId: "B", stage: "stage1", pointsDelta: 100 }, // فريق آخر — يُتجاهل
];

describe("recomputeStageScoresFromAnswers", () => {
  it("يجمع pointsDelta لكل مرحلة لفريق محدد فقط", () => {
    expect(recomputeStageScoresFromAnswers(rows, "A")).toEqual({
      stage1: 10,
      stage2: 12,
      stage3: 40,
      stage4: 17,
    });
  });

  it("يحصر كل مرحلة عند صفر إذا كان المجموع سالباً", () => {
    const penalised: ScoreAnswerRow[] = [
      { teamId: "A", stage: "stage3", pointsDelta: -5 },
      { teamId: "A", stage: "stage3", pointsDelta: -5 },
    ];
    expect(recomputeStageScoresFromAnswers(penalised, "A")).toEqual({
      stage1: 0,
      stage2: 0,
      stage3: 0,
      stage4: 0,
    });
  });

  it("يتجاهل الصفوف بلا pointsDelta رقمي أو بمرحلة غير معروفة", () => {
    const noisy: ScoreAnswerRow[] = [
      { teamId: "A", stage: "stage1", pointsDelta: null },
      { teamId: "A", stage: "—", pointsDelta: 50 },
      { teamId: "A", stage: "stage2", pointsDelta: 8 },
    ];
    expect(recomputeStageScoresFromAnswers(noisy, "A")).toEqual({
      stage1: 0,
      stage2: 8,
      stage3: 0,
      stage4: 0,
    });
  });

  it("يعيد أصفاراً لفريق بلا إجابات", () => {
    expect(recomputeStageScoresFromAnswers(rows, "Z")).toEqual({
      stage1: 0,
      stage2: 0,
      stage3: 0,
      stage4: 0,
    });
  });
});
