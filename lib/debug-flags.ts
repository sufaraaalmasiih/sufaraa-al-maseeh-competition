/** Opt-in: set NEXT_PUBLIC_LOADING_DEBUG_PANEL=true to show on-screen panel. */
export function isLoadingDebugPanelEnabled(): boolean {
  return (
    process.env.NODE_ENV === "development" &&
    process.env.NEXT_PUBLIC_LOADING_DEBUG_PANEL === "true"
  );
}

/** Opt-in: set NEXT_PUBLIC_AUTH_HARD_TRACE=true for console auth traces. */
export function isAuthHardTraceEnabled(): boolean {
  return (
    process.env.NODE_ENV === "development" &&
    process.env.NEXT_PUBLIC_AUTH_HARD_TRACE === "true"
  );
}

/** Opt-in: set NEXT_PUBLIC_REAL_LOADING_DEBUG=true for gate console logs. */
export function isRealLoadingDebugEnabled(): boolean {
  return (
    process.env.NODE_ENV === "development" &&
    process.env.NEXT_PUBLIC_REAL_LOADING_DEBUG === "true"
  );
}
