import { isLoadingDebugPanelEnabled, isRealLoadingDebugEnabled } from "@/lib/debug-flags";
import { patchLoadingDebug } from "@/lib/loading-debug-store";

const PREFIX = "[REAL LOADING DEBUG]";

export function isRealLoadingDebugPanelEnabled(): boolean {
  return isLoadingDebugPanelEnabled();
}

function currentRoute(): string {
  if (typeof window === "undefined") {
    return "(ssr)";
  }
  return window.location.pathname;
}

/** Safe in useEffect / callbacks only — patches panel when enabled. */
export function realLoadingDebug(
  gate: string,
  message: string,
  details?: Record<string, unknown>,
): void {
  const route = currentRoute();
  const lastLog = `${gate}: ${message}`;

  if (isLoadingDebugPanelEnabled()) {
    patchLoadingDebug({
      lastLog,
      lastLogAt: Date.now(),
      route,
    });
  }

  if (!isRealLoadingDebugEnabled()) {
    return;
  }

  const payload = { gate, route, ...details };
  console.info(`${PREFIX} ${gate}: ${message}`, payload);
}
