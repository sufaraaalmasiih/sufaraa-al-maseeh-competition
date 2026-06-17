import { describe, expect, it } from "vitest";
import { getAudienceResultsCountdownLabel } from "@/features/audience/audience-results-countdown";

describe("getAudienceResultsCountdownLabel", () => {
  it("returns remaining seconds as string", () => {
    expect(getAudienceResultsCountdownLabel(5)).toBe("5");
    expect(getAudienceResultsCountdownLabel(1)).toBe("1");
    expect(getAudienceResultsCountdownLabel(0)).toBe("0");
  });
});
