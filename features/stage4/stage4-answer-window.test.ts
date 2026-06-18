import { describe, expect, it } from "vitest";
import {
  STAGE4_MIN_ANSWER_WINDOW_MS,
  canCloseStage4AnswersNow,
  stage4AnswerWindowRemainingMs,
} from "@/features/stage4/stage4-answer-window";

describe("stage4-answer-window", () => {
  it("allows close when openedAt is missing", () => {
    expect(canCloseStage4AnswersNow(null, 10_000)).toBe(true);
  });

  it("blocks close before minimum window elapses", () => {
    const openedAt = 1_000;
    expect(canCloseStage4AnswersNow(openedAt, openedAt + STAGE4_MIN_ANSWER_WINDOW_MS - 1)).toBe(
      false,
    );
    expect(canCloseStage4AnswersNow(openedAt, openedAt + STAGE4_MIN_ANSWER_WINDOW_MS)).toBe(true);
  });

  it("computes remaining window ms", () => {
    const openedAt = 5_000;
    expect(stage4AnswerWindowRemainingMs(openedAt, openedAt + 2_000)).toBe(6_000);
    expect(stage4AnswerWindowRemainingMs(openedAt, openedAt + STAGE4_MIN_ANSWER_WINDOW_MS)).toBe(0);
  });
});
