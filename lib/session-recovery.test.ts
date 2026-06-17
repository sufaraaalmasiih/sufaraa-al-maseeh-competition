import { describe, expect, it } from "vitest";
import { readSessionRecovery, writeSessionRecovery } from "./session-recovery";

describe("session-recovery", () => {
  it("writes and reads recovery snapshot", () => {
    const storage = new Map<string, string>();
    const original = globalThis.sessionStorage;

    Object.defineProperty(globalThis, "sessionStorage", {
      value: {
        setItem: (key: string, value: string) => storage.set(key, value),
        getItem: (key: string) => storage.get(key) ?? null,
      },
      configurable: true,
    });

    writeSessionRecovery({
      status: "stage1_running",
      currentStage: "stage1",
      competitionFrozen: false,
    });

    expect(readSessionRecovery()?.status).toBe("stage1_running");

    Object.defineProperty(globalThis, "sessionStorage", {
      value: original,
      configurable: true,
    });
  });
});
