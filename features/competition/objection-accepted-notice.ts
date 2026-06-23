import { serverTimestamp, updateDoc } from "firebase/firestore";
import { gameFlowRef } from "@/firebase/firestore";
import { getFacilitatorActorName } from "@/features/facilitator/facilitator-actor";
import { getSyncedNowMs } from "@/lib/server-clock-sync";

export const OBJECTION_ACCEPTED_NOTICE_MS = 8_000;

export type ObjectionDecisionScope = "team" | "general";

export interface ObjectionAcceptedNotice {
  message: string;
  scope: ObjectionDecisionScope;
  teamName: string | null;
  teamId: string | null;
  decidedByName: string;
  atMs: number;
  expiresAtMs: number;
  key: string;
}

export function buildObjectionAcceptedMessage(
  scope: ObjectionDecisionScope,
  teamName: string,
): string {
  if (scope === "general") {
    return "تم قبول اعتراض عام — ينطبق على جميع الفرق";
  }
  return `تم قبول اعتراض فريق ${teamName}`;
}

export function objectionDecisionScopeLabel(scope: ObjectionDecisionScope): string {
  return scope === "general" ? "عام (للجميع)" : "خاص بالفريق";
}

export function parseObjectionAcceptedNotice(value: unknown): ObjectionAcceptedNotice | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const data = value as Record<string, unknown>;
  const scope = data.scope === "general" ? "general" : data.scope === "team" ? "team" : null;

  if (
    scope === null ||
    typeof data.message !== "string" ||
    typeof data.decidedByName !== "string" ||
    typeof data.key !== "string" ||
    typeof data.atMs !== "number" ||
    typeof data.expiresAtMs !== "number"
  ) {
    return null;
  }

  return {
    message: data.message,
    scope,
    teamName: typeof data.teamName === "string" ? data.teamName : null,
    teamId: typeof data.teamId === "string" ? data.teamId : null,
    decidedByName: data.decidedByName,
    atMs: data.atMs,
    expiresAtMs: data.expiresAtMs,
    key: data.key,
  };
}

export function isObjectionAcceptedNoticeActive(
  notice: ObjectionAcceptedNotice | null,
  nowMs?: number,
): boolean {
  const now = nowMs ?? getSyncedNowMs();
  return Boolean(notice && now < notice.expiresAtMs);
}

export async function publishObjectionAcceptedNotice(input: {
  objectionId: string;
  scope: ObjectionDecisionScope;
  teamName: string;
  teamId: string;
}): Promise<void> {
  const now = getSyncedNowMs();
  const decidedByName = getFacilitatorActorName();
  const scope = input.scope;
  const message = buildObjectionAcceptedMessage(scope, input.teamName);

  await updateDoc(gameFlowRef, {
    objectionAcceptedNotice: {
      message,
      scope,
      teamName: scope === "team" ? input.teamName : null,
      teamId: scope === "team" ? input.teamId : null,
      decidedByName,
      atMs: now,
      expiresAtMs: now + OBJECTION_ACCEPTED_NOTICE_MS,
      key: `${input.objectionId}-${now}`,
    },
    updatedAt: serverTimestamp(),
  });
}
