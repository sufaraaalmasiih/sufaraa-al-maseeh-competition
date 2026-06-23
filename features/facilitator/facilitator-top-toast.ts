type FacilitatorTopToastListener = (message: string | null) => void;

const listeners = new Set<FacilitatorTopToastListener>();
const AUTO_DISMISS_MS = 4_500;

let dismissTimer: ReturnType<typeof setTimeout> | null = null;

export function subscribeFacilitatorTopToast(listener: FacilitatorTopToastListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function showFacilitatorTopToast(message: string): void {
  for (const listener of listeners) {
    listener(message);
  }

  if (dismissTimer) {
    clearTimeout(dismissTimer);
  }

  dismissTimer = setTimeout(() => {
    for (const listener of listeners) {
      listener(null);
    }
    dismissTimer = null;
  }, AUTO_DISMISS_MS);
}
