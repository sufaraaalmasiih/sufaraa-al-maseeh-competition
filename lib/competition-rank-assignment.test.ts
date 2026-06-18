import { describe, expect, it } from "vitest";
import {
  assignCompetitionRanks,
  compareFinishSpeed,
} from "@/lib/competition-rank-assignment";

describe("assignCompetitionRanks", () => {
  it("يمنح نفس المركز للعلامات المتساوية ويقفز بعدها (1,1,3)", () => {
    const ranked = assignCompetitionRanks(
      [
        { id: "a", score: 50 },
        { id: "b", score: 50 },
        { id: "c", score: 30 },
        { id: "d", score: 30 },
        { id: "e", score: 10 },
      ],
      (item) => item.score,
    );

    expect(ranked.map((item) => item.rank)).toEqual([1, 1, 3, 3, 5]);
  });

  it("يمنح مراكز متتالية عند اختلاف كل العلامات", () => {
    const ranked = assignCompetitionRanks(
      [
        { id: "a", score: 40 },
        { id: "b", score: 30 },
        { id: "c", score: 20 },
      ],
      (item) => item.score,
    );

    expect(ranked.map((item) => item.rank)).toEqual([1, 2, 3]);
  });

  it("يحافظ على بقية الحقول", () => {
    const ranked = assignCompetitionRanks(
      [{ id: "a", score: 10, teamName: "فريق" }],
      (item) => item.score,
    );

    expect(ranked[0]).toMatchObject({ id: "a", score: 10, teamName: "فريق", rank: 1 });
  });
});

describe("compareFinishSpeed", () => {
  it("الأقدم زمنياً (الأسرع إنهاءً) يتقدّم", () => {
    expect(compareFinishSpeed(100, 200)).toBeLessThan(0);
    expect(compareFinishSpeed(200, 100)).toBeGreaterThan(0);
    expect(compareFinishSpeed(100, 100)).toBe(0);
  });

  it("القيم غير المعرّفة تأتي أخيراً", () => {
    expect(compareFinishSpeed(100, null)).toBeLessThan(0);
    expect(compareFinishSpeed(undefined, 100)).toBeGreaterThan(0);
    expect(compareFinishSpeed(null, undefined)).toBe(0);
  });
});
