import { describe, expect, it, vi } from "vitest";
import {
  AUDIENCE_DISPLAY_PATH,
  AUDIENCE_EMBED_PATH,
  getAudienceDisplayUrl,
  openAudienceDisplayTab,
} from "@/features/audience/audience-display-utils";

describe("audience-display-utils", () => {
  it("exposes standalone and embed paths", () => {
    expect(AUDIENCE_DISPLAY_PATH).toBe("/audience");
    expect(AUDIENCE_EMBED_PATH).toBe("/audience?embed=1");
  });

  it("builds absolute audience url from the current origin", () => {
    expect(getAudienceDisplayUrl()).toMatch(/\/audience$/);
  });

  it("reports when the browser blocks a new audience tab", () => {
    const open = vi.fn(() => null);
    vi.stubGlobal("window", {
      open,
      location: { origin: "http://localhost:3000" },
    });

    expect(openAudienceDisplayTab()).toBe(false);
    expect(open).toHaveBeenCalledWith(
      "http://localhost:3000/audience",
      "_blank",
      "noopener,noreferrer",
    );

    vi.unstubAllGlobals();
  });
});
