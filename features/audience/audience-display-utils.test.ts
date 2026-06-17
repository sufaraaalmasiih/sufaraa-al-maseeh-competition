import { describe, expect, it } from "vitest";
import {
  AUDIENCE_DISPLAY_PATH,
  AUDIENCE_EMBED_PATH,
  getAudienceDisplayUrl,
} from "@/features/audience/audience-display-utils";

describe("audience-display-utils", () => {
  it("exposes standalone and embed paths", () => {
    expect(AUDIENCE_DISPLAY_PATH).toBe("/audience");
    expect(AUDIENCE_EMBED_PATH).toBe("/audience?embed=1");
  });

  it("builds absolute audience url from the current origin", () => {
    expect(getAudienceDisplayUrl()).toMatch(/\/audience$/);
  });
});
