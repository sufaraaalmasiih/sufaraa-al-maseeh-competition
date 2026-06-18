import { describe, expect, it } from "vitest";
import { formatSaveError, formatSaveErrorFromCode } from "@/lib/format-save-error";

describe("formatSaveError", () => {
  it("maps firebase permission-denied codes to Arabic", () => {
    expect(formatSaveError({ code: "permission-denied", message: "" })).toContain("صلاحية");
  });

  it("translates known English timer messages", () => {
    expect(formatSaveError(new Error("Stage 1 timer expired."))).toBe("انتهى وقت الإجابة.");
  });

  it("returns Arabic fallback for unknown non-error values", () => {
    expect(formatSaveError(null)).toContain("تعذر حفظ الإجابة");
  });

  it("delegates from formatSaveErrorFromCode", () => {
    expect(formatSaveErrorFromCode(new Error("Missing authenticated team."))).toContain("تسجيل الدخول");
  });
});
