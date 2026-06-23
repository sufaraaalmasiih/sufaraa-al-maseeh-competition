import { describe, expect, it } from "vitest";
import { getGradualRevealSequenceKey } from "@/hooks/use-gradual-reveal";

describe("getGradualRevealSequenceKey", () => {
  it("builds stable keys from answer ids regardless of array identity", () => {
    const first = [
      { answerDocId: "a1", teamId: "t1" },
      { answerDocId: "a2", teamId: "t2" },
    ];
    const second = [
      { answerDocId: "a1", teamId: "t1" },
      { answerDocId: "a2", teamId: "t2" },
    ];
    expect(getGradualRevealSequenceKey(first)).toBe("a1|a2");
    expect(getGradualRevealSequenceKey(second)).toBe("a1|a2");
  });
});
