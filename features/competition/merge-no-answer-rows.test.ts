import { describe, expect, it } from "vitest";
import { mergeNoAnswerRows } from "@/features/competition/merge-no-answer-rows";
import type { RevealResultsAnswerRow } from "@/features/stage4/reveal-results-answer-row";

function answer(teamId: string, teamName: string): RevealResultsAnswerRow {
  return {
    answerDocId: `doc-${teamId}`,
    teamId,
    teamName,
    answerText: "إجابة",
    passed: false,
    confirmed: true,
    isCorrect: true,
    pointsDelta: 15,
    streakBefore: 0,
    streakAfter: 1,
  };
}

describe("mergeNoAnswerRows", () => {
  it("adds a 'no_answer' row for every team without an answer", () => {
    const answers = [answer("t1", "ألفا")];
    const teams = [
      { teamId: "t1", teamName: "ألفا" },
      { teamId: "t2", teamName: "بيتا" },
      { teamId: "t3", teamName: "جيم" },
    ];

    const merged = mergeNoAnswerRows(answers, teams);

    expect(merged).toHaveLength(3);
    const missing = merged.filter((row) => row.outcome === "no_answer");
    expect(missing.map((row) => row.teamId).sort()).toEqual(["t2", "t3"]);
    for (const row of missing) {
      expect(row.isCorrect).toBe(false);
      expect(row.passed).toBe(false);
      expect(row.pointsDelta).toBe(0);
      expect(row.answerText).toBe("—");
    }
  });

  it("keeps real answers untouched and does not duplicate answered teams", () => {
    const answers = [answer("t1", "ألفا"), answer("t2", "بيتا")];
    const teams = [
      { teamId: "t1", teamName: "ألفا" },
      { teamId: "t2", teamName: "بيتا" },
    ];

    const merged = mergeNoAnswerRows(answers, teams);

    expect(merged).toHaveLength(2);
    expect(merged.every((row) => row.outcome !== "no_answer")).toBe(true);
  });

  it("sorts the merged rows by Arabic team name", () => {
    const answers = [answer("t2", "بيتا")];
    const teams = [
      { teamId: "t1", teamName: "ألفا" },
      { teamId: "t2", teamName: "بيتا" },
    ];

    const merged = mergeNoAnswerRows(answers, teams);

    expect(merged.map((row) => row.teamName)).toEqual(["ألفا", "بيتا"]);
  });
});
