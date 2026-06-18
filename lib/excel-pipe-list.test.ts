import { describe, expect, it } from "vitest";
import { parseExcelCorrectOrderList, splitPipeList } from "@/lib/excel-pipe-list";

describe("parseExcelCorrectOrderList", () => {
  it("normalizes numeric sequences to ascending order", () => {
    expect(parseExcelCorrectOrderList("3 | 4 | 2 | 1")).toEqual(["1", "2", "3", "4"]);
  });

  it("keeps word order unchanged", () => {
    expect(parseExcelCorrectOrderList("مصباح | لرجلي | كلامك")).toEqual([
      "مصباح",
      "لرجلي",
      "كلامك",
    ]);
  });

  it("splitPipeList stays left-to-right for fragments", () => {
    expect(splitPipeList("3 | 4 | 2 | 1")).toEqual(["3", "4", "2", "1"]);
  });
});
