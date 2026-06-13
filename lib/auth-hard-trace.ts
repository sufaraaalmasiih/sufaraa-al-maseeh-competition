import { isAuthHardTraceEnabled, isLoadingDebugPanelEnabled } from "@/lib/debug-flags";
import { patchLoadingDebug } from "@/lib/loading-debug-store";

const BUILD_STAMP = "auth-fix-2026-06-07d";

/** Console-only trace — safe anywhere (no store updates). */
export function authHardTrace(message: string, details?: Record<string, unknown>): void {
  if (!isAuthHardTraceEnabled()) {
    return;
  }

  const line = `[AUTH HARD TRACE] ${message}`;
  if (details) {
    console.log(line, { build: BUILD_STAMP, ...details });
  } else {
    console.log(line, { build: BUILD_STAMP });
  }
}

/** Updates debug panel — call only from useEffect / event / async callbacks. */
export function authHardTracePanel(message: string, details?: Record<string, unknown>): void {
  authHardTrace(message, details);

  if (!isLoadingDebugPanelEnabled()) {
    return;
  }

  patchLoadingDebug({
    lastLog: message,
    lastLogAt: Date.now(),
  });
}

export function authHardTraceError(message: string, error: unknown): void {
  if (!isAuthHardTraceEnabled()) {
    return;
  }

  console.error(`[AUTH HARD TRACE] ${message}`, {
    build: BUILD_STAMP,
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
  });
}
