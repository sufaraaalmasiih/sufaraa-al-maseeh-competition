import { firebaseAuth } from "@/firebase/firebaseClient";
import { authDebug, patchAuthDiagnostics } from "@/lib/auth-debug";

const AUTH_READY_DIAGNOSTIC_TIMEOUT_MS = 5_000;

/**
 * Non-blocking diagnostic watcher. Does NOT gate onAuthStateChanged subscription.
 */
export function watchFirebaseAuthReadyDiagnostic(): () => void {
  let cancelled = false;

  void (async () => {
    authDebug("authStateReady watch started");
    patchAuthDiagnostics({
      authStateReady: "pending",
      blockingCondition: "authStateReady pending (diagnostic only — listener not blocked)",
    });

    try {
      await Promise.race([
        firebaseAuth.authStateReady(),
        new Promise<never>((_, reject) => {
          window.setTimeout(() => {
            reject(new Error("authStateReady diagnostic timeout after 5s"));
          }, AUTH_READY_DIAGNOSTIC_TIMEOUT_MS);
        }),
      ]);

      if (cancelled) {
        return;
      }

      authDebug("authStateReady resolved");
      patchAuthDiagnostics({
        authStateReady: "resolved",
        blockingCondition: diagnosticsAfterReady(),
      });
    } catch (error) {
      if (cancelled) {
        return;
      }

      authDebug("authStateReady diagnostic timeout", {
        error: error instanceof Error ? error.message : String(error),
      });
      patchAuthDiagnostics({
        authStateReady: "timeout",
        blockingCondition:
          "authStateReady hung >5s (IndexedDB/persistence) — onAuthStateChanged proceeds independently",
      });
    }
  })();

  return () => {
    cancelled = true;
  };
}

function diagnosticsAfterReady(): string {
  return "authStateReady resolved — awaiting onAuthStateChanged callback if not yet fired";
}
