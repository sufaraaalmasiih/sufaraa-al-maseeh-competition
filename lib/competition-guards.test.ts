import { describe, expect, it } from "vitest";
import {
  assertAnsweringTimerOpen,
  assertCompetitionNotFrozen,
  assertTimerNotPaused,
  COMPETITION_FROZEN_MESSAGE,
  isAnsweringTimerExpired,
  TIMER_PAUSED_MESSAGE,
} from "@/lib/competition-guards";

describe("competition-guards", () => {
  it("rejects frozen competition submissions", () => {
    expect(() => assertCompetitionNotFrozen({ competitionFrozen: true })).toThrow(
      COMPETITION_FROZEN_MESSAGE,
    );
  });

  it("rejects paused timer submissions", () => {
    expect(() => assertTimerNotPaused({ paused: true })).toThrow(TIMER_PAUSED_MESSAGE);
  });

  it("treats paused timer as not expired", () => {
    const timer = {
      active: true,
      stage: "stage1",
      purpose: "answering",
      endsAtMs: Date.now() - 1_000,
      paused: true,
    };

    expect(isAnsweringTimerExpired(timer, "stage1", "answering")).toBe(false);
  });

  it("detects expired answering timer", () => {
    const timer = {
      active: true,
      stage: "stage3",
      purpose: "answering",
      endsAtMs: Date.now() - 4_000,
      paused: false,
    };

    expect(isAnsweringTimerExpired(timer, "stage3", "answering")).toBe(true);
    expect(() =>
      assertAnsweringTimerOpen(timer, "stage3", "answering", "انتهى الوقت."),
    ).toThrow("انتهى الوقت.");
  });

  it("allows a short grace window after timer expiry for saves", () => {
    const timer = {
      active: true,
      stage: "stage3",
      purpose: "answering",
      endsAtMs: Date.now() - 500,
      paused: false,
    };

    expect(() =>
      assertAnsweringTimerOpen(timer, "stage3", "answering", "انتهى الوقت."),
    ).not.toThrow();
  });

  it("rejects saves after the full grace window", () => {
    const timer = {
      active: true,
      stage: "stage3",
      purpose: "answering",
      endsAtMs: Date.now() - 3_500,
      paused: false,
    };

    expect(() =>
      assertAnsweringTimerOpen(timer, "stage3", "answering", "انتهى الوقت."),
    ).toThrow("انتهى الوقت.");
  });
});
