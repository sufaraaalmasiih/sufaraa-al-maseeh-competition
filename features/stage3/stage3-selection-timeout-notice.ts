import { getSyncedNowMs } from "@/lib/server-clock-sync";

export const STAGE3_SELECTION_TIMEOUT_NOTICE_MS = 5000;

export interface Stage3SelectionTimeoutNotice {
  ownerTeamName: string;
  ownerTeamId: string;
  penaltyPoints: number;
  atMs: number;
  expiresAtMs: number;
  key: string;
}

export function parseStage3SelectionTimeoutNotice(
  value: unknown,
): Stage3SelectionTimeoutNotice | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const data = value as Record<string, unknown>;

  if (
    typeof data.ownerTeamName !== "string" ||
    typeof data.ownerTeamId !== "string" ||
    typeof data.key !== "string" ||
    typeof data.atMs !== "number" ||
    typeof data.expiresAtMs !== "number"
  ) {
    return null;
  }

  return {
    ownerTeamName: data.ownerTeamName,
    ownerTeamId: data.ownerTeamId,
    penaltyPoints:
      typeof data.penaltyPoints === "number" ? data.penaltyPoints : -5,
    atMs: data.atMs,
    expiresAtMs: data.expiresAtMs,
    key: data.key,
  };
}

export function isStage3SelectionTimeoutNoticeActive(
  notice: Stage3SelectionTimeoutNotice | null,
  nowMs?: number,
): boolean {
  const now = nowMs ?? getSyncedNowMs();
  return Boolean(notice && now < notice.expiresAtMs);
}
