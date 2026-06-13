import { isLoadingDebugPanelEnabled } from "@/lib/debug-flags";
import { patchLoadingDebug } from "@/lib/loading-debug-store";

const PREFIX = "[AUTH DEBUG]";

export type AuthStateReadyStatus = "pending" | "resolved" | "timeout";

export interface AuthDiagnosticSnapshot {
  authStateReady: AuthStateReadyStatus;
  onAuthStateChangedSubscribed: boolean;
  onAuthStateChangedFired: boolean;
  onIdTokenChangedFired: boolean;
  roleLookupStarted: boolean;
  roleLookupFinished: boolean;
  useAuthRoleSubscriptionCount: number;
  blockingCondition: string;
}

const initialDiagnostics: AuthDiagnosticSnapshot = {
  authStateReady: "pending",
  onAuthStateChangedSubscribed: false,
  onAuthStateChangedFired: false,
  onIdTokenChangedFired: false,
  roleLookupStarted: false,
  roleLookupFinished: false,
  useAuthRoleSubscriptionCount: 0,
  blockingCondition: "initial — waiting for useAuthRole mount",
};

let diagnostics: AuthDiagnosticSnapshot = { ...initialDiagnostics };

export function getAuthDiagnostics(): AuthDiagnosticSnapshot {
  return diagnostics;
}

export function patchAuthDiagnostics(partial: Partial<AuthDiagnosticSnapshot>): void {
  diagnostics = { ...diagnostics, ...partial };

  if (!isLoadingDebugPanelEnabled()) {
    return;
  }

  patchLoadingDebug({
    authStateReady: diagnostics.authStateReady,
    authCallbackFired: diagnostics.onAuthStateChangedFired,
    authBlockingCondition: diagnostics.blockingCondition,
    lastLog: `AUTH: ${diagnostics.blockingCondition}`,
    lastLogAt: Date.now(),
  });
}

export function authDebug(message: string, details?: Record<string, unknown>): void {
  if (process.env.NODE_ENV !== "development") {
    return;
  }

  if (details) {
    console.info(`${PREFIX} ${message}`, details);
    return;
  }

  console.info(`${PREFIX} ${message}`);
}

export function authDebugTimeout(): void {
  const snapshot = getAuthDiagnostics();
  authDebug("timeout reached", {
    authStateReady: snapshot.authStateReady,
    onAuthStateChangedSubscribed: snapshot.onAuthStateChangedSubscribed,
    onAuthStateChangedFired: snapshot.onAuthStateChangedFired,
    onIdTokenChangedFired: snapshot.onIdTokenChangedFired,
    roleLookupStarted: snapshot.roleLookupStarted,
    roleLookupFinished: snapshot.roleLookupFinished,
    useAuthRoleSubscriptionCount: snapshot.useAuthRoleSubscriptionCount,
    blockingCondition: snapshot.blockingCondition,
  });
  patchAuthDiagnostics({
    blockingCondition: `TIMEOUT 5s — ${snapshot.blockingCondition}`,
  });
}
