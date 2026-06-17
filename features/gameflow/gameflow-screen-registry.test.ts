import { describe, expect, it } from "vitest";
import {
  resolveGameFlowScreen,
  type GameFlowScreenRegistry,
} from "@/features/gameflow/gameflow-screen-registry";
import type { GameFlowStatus } from "@/types";

describe("gameflow-screen-registry", () => {
  it("resolves registered status renderers", () => {
    const registry: GameFlowScreenRegistry<{ label: string }> = {
      stage1_intro: ({ label }) => `intro:${label}`,
      podium: () => "podium",
    };

    expect(resolveGameFlowScreen(registry, "stage1_intro", { label: "أ" })).toBe("intro:أ");
    expect(resolveGameFlowScreen(registry, "podium", { label: "ignored" })).toBe("podium");
  });

  it("returns undefined for unregistered statuses", () => {
    const registry: GameFlowScreenRegistry<null> = {};
    expect(resolveGameFlowScreen(registry, "waiting_players" as GameFlowStatus, null)).toBeUndefined();
  });
});
