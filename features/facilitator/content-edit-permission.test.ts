import { describe, expect, it } from "vitest";
import { resolveContentEditGate } from "@/features/facilitator/content-edit-permission";

describe("resolveContentEditGate", () => {
  it("locks everyone while a competition is running", () => {
    const gate = resolveContentEditGate({
      role: "super_admin",
      status: "stage1_running",
      competitionMode: "training",
    });
    expect(gate.editable).toBe(false);
  });

  it("lets the super admin edit before the competition (any mode)", () => {
    expect(
      resolveContentEditGate({
        role: "super_admin",
        status: "waiting_players",
        competitionMode: "official",
      }).editable,
    ).toBe(true);
  });

  it("blocks a facilitator from editing in official mode", () => {
    const gate = resolveContentEditGate({
      role: "facilitator",
      status: "waiting_players",
      competitionMode: "official",
    });
    expect(gate.editable).toBe(false);
    expect(gate.reason).toContain("التدريبية");
  });

  it("lets a facilitator edit in training mode", () => {
    expect(
      resolveContentEditGate({
        role: "facilitator",
        status: "waiting_players",
        competitionMode: "training",
      }).editable,
    ).toBe(true);
  });
});
