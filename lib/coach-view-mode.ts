const COACH_VIEW_MODE_KEY = "sufaraa:coach-view-mode";

export type CoachViewMode = "coach" | "player";

function hasSessionStorage(): boolean {
  try {
    return typeof globalThis.sessionStorage !== "undefined";
  } catch {
    return false;
  }
}

export function setCoachViewMode(mode: CoachViewMode): void {
  if (!hasSessionStorage()) {
    return;
  }

  try {
    sessionStorage.setItem(COACH_VIEW_MODE_KEY, mode);
  } catch {
    // ignore
  }
}

export function getCoachViewMode(): CoachViewMode | null {
  if (!hasSessionStorage()) {
    return null;
  }

  try {
    const value = sessionStorage.getItem(COACH_VIEW_MODE_KEY);
    return value === "coach" || value === "player" ? value : null;
  } catch {
    return null;
  }
}

export function isCoachDashboardPreferred(): boolean {
  return getCoachViewMode() === "coach";
}
