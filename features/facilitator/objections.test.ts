import { describe, expect, it } from "vitest";
import {
  mergeObjectionsById,
  objectionsForActiveSession,
  parseArchivedObjections,
  type CompetitionObjection,
} from "@/features/facilitator/objections";

function makeObjection(
  overrides: Partial<CompetitionObjection> & { id: string },
): CompetitionObjection {
  return {
    teamId: "team-1",
    teamName: "فريق",
    questionId: null,
    questionLabel: "سؤال",
    stage: "stage1",
    reasons: [],
    note: "",
    sessionId: "session-1",
    sessionTitle: null,
    status: "open",
    createdAtMs: 0,
    ...overrides,
  };
}

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

describe("parseArchivedObjections", () => {
  it("parses objections stored inside a session history doc", () => {
    const parsed = parseArchivedObjections([
      { id: "x", teamName: "ألفا", reasons: ["wrong_reference"], status: "reviewed", createdAtMs: 5 },
    ]);
    expect(parsed).toHaveLength(1);
    expect(parsed[0]).toMatchObject({ id: "x", teamName: "ألفا", status: "reviewed" });
  });

  it("ignores non-array, non-object, and id-less entries", () => {
    expect(parseArchivedObjections(undefined)).toEqual([]);
    expect(parseArchivedObjections([null, 3, { teamName: "no id" }])).toEqual([]);
  });
});

describe("mergeObjectionsById", () => {
  it("dedupes by id and sorts newest first", () => {
    const archived = [makeObjection({ id: "a", createdAtMs: 10 })];
    const live = [
      makeObjection({ id: "a", createdAtMs: 10 }),
      makeObjection({ id: "b", createdAtMs: 20 }),
    ];
    expect(mergeObjectionsById(archived, live).map((row) => row.id)).toEqual(["b", "a"]);
  });
});
