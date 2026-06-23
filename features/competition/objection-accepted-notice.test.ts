import { describe, expect, it } from "vitest";
import {
  buildObjectionAcceptedMessage,
  objectionDecisionScopeLabel,
  parseObjectionAcceptedNotice,
} from "@/features/competition/objection-accepted-notice";

describe("objection accepted notice", () => {
  it("builds team-specific and general messages", () => {
    expect(buildObjectionAcceptedMessage("team", "ألفا")).toBe("تم قبول اعتراض فريق ألفا");
    expect(buildObjectionAcceptedMessage("general", "ألفا")).toBe(
      "تم قبول اعتراض عام — ينطبق على جميع الفرق",
    );
  });

  it("parses notice from gameFlow payload", () => {
    const notice = {
      message: "تم قبول اعتراض فريق ألفا",
      scope: "team",
      teamName: "ألفا",
      teamId: "team-1",
      decidedByName: "ميسر",
      atMs: 100,
      expiresAtMs: 8_100,
      key: "obj-1",
    };
    expect(parseObjectionAcceptedNotice(notice)).toEqual(notice);
    expect(objectionDecisionScopeLabel("general")).toBe("عام (للجميع)");
  });
});
