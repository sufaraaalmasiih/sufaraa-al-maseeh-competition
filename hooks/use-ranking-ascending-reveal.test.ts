import { describe, expect, it } from "vitest";
import {
  filterRankingByRevealedIds,
  sortRankingWorstFirst,
} from "@/hooks/use-ranking-ascending-reveal";

describe("ranking ascending reveal helpers", () => {
  const teams = [
    { teamId: "a", rank: 1 },
    { teamId: "b", rank: 2 },
    { teamId: "c", rank: 3 },
  ];

  it("sorts teams worst-first for reveal order", () => {
    expect(sortRankingWorstFirst(teams).map((team) => team.teamId)).toEqual(["c", "b", "a"]);
  });

  it("keeps rank order while only showing revealed teams", () => {
    const visible = filterRankingByRevealedIds(teams, new Set(["b", "c"]));
    expect(visible.map((team) => team.teamId)).toEqual(["b", "c"]);
  });
});
