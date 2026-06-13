"use client";

import { useEffect } from "react";
import { isAuthHardTraceEnabled, isRealLoadingDebugEnabled } from "@/lib/debug-flags";
import { authHardTrace, authHardTraceError } from "@/lib/auth-hard-trace";
import { realLoadingDebug } from "@/lib/real-loading-debug";

export function RealLoadingDebugBootstrap() {
  const enabled = isAuthHardTraceEnabled() || isRealLoadingDebugEnabled();

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    authHardTrace("ClientBootstrap hydration started", {
      href: window.location.href,
    });
    realLoadingDebug("ClientBootstrap", "client JS executed — hydration started", {
      href: window.location.href,
    });

    const onError = (event: ErrorEvent) => {
      authHardTraceError("window.onerror", event.error ?? event.message);
    };
    const onRejection = (event: PromiseRejectionEvent) => {
      authHardTraceError("unhandledrejection", event.reason);
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);

    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, [enabled]);

  return null;
}
