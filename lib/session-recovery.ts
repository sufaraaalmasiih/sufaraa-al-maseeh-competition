const SESSION_RECOVERY_KEY = "sufaraa:session-recovery";

export interface SessionRecoverySnapshot {
  status: string | null;
  currentStage: string;
  competitionFrozen: boolean;
  savedAtMs: number;
}

function hasSessionStorage(): boolean {
  try {
    return typeof globalThis.sessionStorage !== "undefined";
  } catch {
    return false;
  }
}

export function writeSessionRecovery(snapshot: Omit<SessionRecoverySnapshot, "savedAtMs">): void {
  if (!hasSessionStorage()) {
    return;
  }

  try {
    sessionStorage.setItem(
      SESSION_RECOVERY_KEY,
      JSON.stringify({ ...snapshot, savedAtMs: Date.now() } satisfies SessionRecoverySnapshot),
    );
  } catch {
    // sessionStorage may be unavailable in private mode.
  }
}

export function readSessionRecovery(): SessionRecoverySnapshot | null {
  if (!hasSessionStorage()) {
    return null;
  }

  try {
    const raw = sessionStorage.getItem(SESSION_RECOVERY_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as SessionRecoverySnapshot;
    if (!parsed || typeof parsed !== "object") {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}
