import { describe, expect, it } from "vitest";
import {
  parseStage4FinishedQuestionIds,
  parseStage4QuestionMetadata,
} from "@/features/stage4/stage4-question-metadata";

describe("stage4 question metadata parsers", () => {
  it("parses multiple choice question", () => {
    const parsed = parseStage4QuestionMetadata({
      id: "s4-1",
      type: "multiple_choice",
      prompt: "سؤال",
      correctAnswer: "أ",
      options: ["أ", "ب"],
    });

    expect(parsed?.type).toBe("multiple_choice");
    expect(parsed?.options).toEqual(["أ", "ب"]);
  });

  it("parses legacy link question", () => {
    const parsed = parseStage4QuestionMetadata({
      id: "s4-2",
      type: "link",
      prompt: "اربط",
      correctAnswer: "جواب",
    });

    expect(parsed?.type).toBe("link");
  });

  it("rejects invalid payloads", () => {
    expect(parseStage4QuestionMetadata(null)).toBeNull();
    expect(
      parseStage4QuestionMetadata({
        id: "x",
        type: "multiple_choice",
        prompt: "سؤال",
        correctAnswer: "أ",
        options: ["أ"],
      }),
    ).toBeNull();
  });

  it("parses finished question ids", () => {
    expect(parseStage4FinishedQuestionIds(["a", "", 2, "b"])).toEqual(["a", "b"]);
    expect(parseStage4FinishedQuestionIds("bad")).toEqual([]);
  });
});
