export const FIRESTORE_LISTENER_TIMEOUT_MS = 10_000;

export function scheduleFirestoreListenerTimeout(
  isStillLoading: () => boolean,
  onTimeout: () => void,
  timeoutMs: number = FIRESTORE_LISTENER_TIMEOUT_MS,
): () => void {
  const timeoutId = window.setTimeout(() => {
    if (!isStillLoading()) {
      return;
    }
    onTimeout();
  }, timeoutMs);

  return () => {
    window.clearTimeout(timeoutId);
  };
}
