/** Dev-only runtime tracing for loading/hydration issues. */
export function runtimeDebug(message: string, details?: Record<string, unknown>): void {
  if (process.env.NODE_ENV !== "development") {
    return;
  }

  if (details) {
    console.info(`[DEBUG] ${message}`, details);
    return;
  }

  console.info(`[DEBUG] ${message}`);
}
