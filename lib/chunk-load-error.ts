export function isChunkLoadError(error: unknown): boolean {
  if (!error) {
    return false;
  }

  const message = error instanceof Error ? error.message : String(error);
  const name = error instanceof Error ? error.name : "";

  if (name === "ChunkLoadError" || message.includes("ChunkLoadError")) {
    return true;
  }

  return (
    /Loading chunk [\w-]+ failed/i.test(message) ||
    message.includes("Failed to fetch dynamically imported module")
  );
}

const CHUNK_RELOAD_COUNT_KEY = "sufaraa-chunk-reload-count";
const MAX_CHUNK_RELOAD_ATTEMPTS = 1;

export function reloadOnceForChunkError(): void {
  if (typeof window === "undefined") {
    return;
  }

  // Dev/HMR often throws stale-chunk errors — allow one reload, then stop.
  if (process.env.NODE_ENV === "development") {
    try {
      const devKey = "sufaraa-dev-chunk-reload";
      if (sessionStorage.getItem(devKey) === "1") {
        console.warn(
          "[chunk-recovery] Chunk load error in development. Run `npm run dev:clean` then hard-refresh.",
        );
        return;
      }
      sessionStorage.setItem(devKey, "1");
      window.location.reload();
    } catch {
      console.warn(
        "[chunk-recovery] Chunk load error in development. Run `npm run dev:clean` then hard-refresh.",
      );
    }
    return;
  }

  try {
    const attempts = Number(sessionStorage.getItem(CHUNK_RELOAD_COUNT_KEY) ?? "0");
    if (attempts >= MAX_CHUNK_RELOAD_ATTEMPTS) {
      return;
    }

    sessionStorage.setItem(CHUNK_RELOAD_COUNT_KEY, String(attempts + 1));
  } catch {
    return;
  }

  window.location.reload();
}
