import { describe, expect, it } from "vitest";
import { normalizeImageUrl } from "@/lib/normalize-image-url";

describe("normalizeImageUrl", () => {
  it("keeps local and direct HTTPS URLs usable", () => {
    expect(normalizeImageUrl("/images/question.png")).toBe("/images/question.png");
    expect(normalizeImageUrl(" https://example.com/a b.png ")).toBe(
      "https://example.com/a%20b.png",
    );
  });

  it("converts Google Drive sharing links to embeddable image links", () => {
    expect(
      normalizeImageUrl("https://drive.google.com/file/d/abc123/view?usp=sharing"),
    ).toBe("https://drive.google.com/thumbnail?id=abc123&sz=w1600");

    expect(normalizeImageUrl("https://drive.google.com/open?id=xyz789")).toBe(
      "https://drive.google.com/thumbnail?id=xyz789&sz=w1600",
    );
  });

  it("converts Dropbox sharing links to raw image links", () => {
    expect(normalizeImageUrl("https://www.dropbox.com/s/demo/photo.png?dl=0")).toBe(
      "https://www.dropbox.com/s/demo/photo.png?raw=1",
    );
  });

  it("rejects non-image-safe protocols", () => {
    expect(normalizeImageUrl("javascript:alert(1)")).toBe("");
  });
});
