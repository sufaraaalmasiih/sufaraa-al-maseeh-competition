import { describe, expect, it } from "vitest";
import {
  isStage3SelectionTimeoutNoticeActive,
  parseStage3SelectionTimeoutNotice,
} from "@/features/stage3/stage3-selection-timeout-notice";

describe("stage3 selection timeout notice", () => {
  const notice = {
    ownerTeamName: "فريق أ",
    ownerTeamId: "team-1",
    penaltyPoints: -5,
    atMs: 1_000,
    expiresAtMs: 6_000,
    key: "timeout-1",
  };

  it("parses valid notice", () => {
    expect(parseStage3SelectionTimeoutNotice(notice)).toEqual(notice);
  });

  it("defaults penalty when missing", () => {
    const { penaltyPoints: _ignored, ...withoutPenalty } = notice;
    expect(parseStage3SelectionTimeoutNotice(withoutPenalty)?.penaltyPoints).toBe(-5);
  });

  it("rejects invalid notice payloads", () => {
    expect(parseStage3SelectionTimeoutNotice(null)).toBeNull();
    expect(parseStage3SelectionTimeoutNotice({ ownerTeamName: "x" })).toBeNull();
  });

  it("checks active window", () => {
    expect(isStage3SelectionTimeoutNoticeActive(notice, 5_000)).toBe(true);
    expect(isStage3SelectionTimeoutNoticeActive(notice, 6_000)).toBe(false);
    expect(isStage3SelectionTimeoutNoticeActive(null, 1_000)).toBe(false);
  });
});
