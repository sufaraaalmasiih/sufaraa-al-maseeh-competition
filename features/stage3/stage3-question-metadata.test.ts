import { describe, expect, it } from "vitest";
import {
  parseStage3OpenedQuestionIds,
  parseStage3OwnerTeamId,
  parseStage3OwnerTeamName,
  parseStage3QuestionMetadata,
  parseStage3UsedQuestionIds,
} from "@/features/stage3/stage3-question-metadata";

describe("stage3 question metadata parsers", () => {
  const validQuestion = {
    id: "s3-q-1",
    fieldId: "history",
    fieldLabel: "التاريخ",
    difficulty: "medium",
    questionNumber: 3,
  };

  it("parses valid question metadata", () => {
    expect(parseStage3QuestionMetadata(validQuestion)).toEqual(validQuestion);
  });

  it("rejects invalid question metadata", () => {
    expect(parseStage3QuestionMetadata(null)).toBeNull();
    expect(parseStage3QuestionMetadata({ ...validQuestion, difficulty: "extreme" })).toBeNull();
  });

  it("parses opened and used question id arrays", () => {
    expect(parseStage3OpenedQuestionIds(["a", 1, "b"])).toEqual(["a", "b"]);
    expect(parseStage3UsedQuestionIds("invalid")).toEqual([]);
  });

  it("parses owner team fields", () => {
    expect(parseStage3OwnerTeamId("team-1")).toBe("team-1");
    expect(parseStage3OwnerTeamId("")).toBeNull();
    expect(parseStage3OwnerTeamName("فريق أ")).toBe("فريق أ");
  });
});
