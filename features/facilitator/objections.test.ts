import { describe, expect, it } from "vitest";
import { objectionsForActiveSession } from "@/features/facilitator/objections";

interface Row {
  id: string;
  sessionId: string | null;
}

const rows: Row[] = [
  { id: "a", sessionId: "session-1" },
  { id: "b", sessionId: "session-1" },
  { id: "c", sessionId: "session-2" },
  { id: "d", sessionId: null },
];

describe("objectionsForActiveSession", () => {
  it("returns only objections of the active session", () => {
    expect(objectionsForActiveSession(rows, "session-1").map((row) => row.id)).toEqual([
      "a",
      "b",
    ]);
  });

  it("resets to zero when a new competition starts (session has no objections yet)", () => {
    expect(objectionsForActiveSession(rows, "session-new")).toEqual([]);
  });

  it("matches training/null-session objections when no session is active", () => {
    expect(objectionsForActiveSession(rows, null).map((row) => row.id)).toEqual(["d"]);
  });

  it("does not leak previous-competition objections into a different session", () => {
    expect(objectionsForActiveSession(rows, "session-2").map((row) => row.id)).toEqual([
      "c",
    ]);
  });
});
