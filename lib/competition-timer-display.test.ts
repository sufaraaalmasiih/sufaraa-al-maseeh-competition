import { describe, expect, it } from "vitest";
import {
  computeRemainingSeconds,
  isTimerExpiredForSubmit,
  isTimerExpiredForUi,
} from "@/lib/competition-timer-display";
import { setServerClockOffsetForTests } from "@/lib/server-clock-sync";
import type { CompetitionTimer } from "@/types";

describe("competition-timer-display", () => {
  it("computes remaining seconds from endsAtMs", () => {
    const now = 1_000_000;
    const timer = {
      active: true,
      stage: "stage1",
      purpose: "answering",
      durationSeconds: 120,
      startedAtMs: now - 30_000,
      endsAtMs: now + 90_000,
      paused: false,
      pausedRemainingMs: 0,
    } as CompetitionTimer;

    expect(computeRemainingSeconds(timer, now)).toBe(90);
    expect(isTimerExpiredForUi(timer, now)).toBe(false);
    expect(isTimerExpiredForSubmit(timer, now)).toBe(false);
  });

  it("uses synced server clock offset when now is omitted", () => {
    setServerClockOffsetForTests(10_000);
    const localNow = Date.now();
    const syncedNow = localNow + 10_000;
    const timer = {
      active: true,
      stage: "stage1",
      purpose: "answering",
      durationSeconds: 60,
      startedAtMs: syncedNow - 5_000,
      endsAtMs: syncedNow + 55_000,
      paused: false,
      pausedRemainingMs: 0,
    } as CompetitionTimer;

    expect(computeRemainingSeconds(timer)).toBe(55);
    setServerClockOffsetForTests(0);
  });
});
