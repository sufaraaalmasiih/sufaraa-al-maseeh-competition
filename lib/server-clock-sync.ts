import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { getClientFirestore } from "@/firebase/firebaseClient";

const RESYNC_INTERVAL_MS = 5 * 60 * 1000;

let offsetMs = 0;
let lastSyncAtMs = 0;
let syncPromise: Promise<void> | null = null;

export function getServerClockOffsetMs(): number {
  return offsetMs;
}

/** Estimated Firebase server time using the last RTT probe offset. */
export function getSyncedNowMs(): number {
  return Date.now() + offsetMs;
}

export function setServerClockOffsetForTests(nextOffsetMs: number): void {
  offsetMs = nextOffsetMs;
}

export async function syncServerClockOffset(force = false): Promise<void> {
  if (typeof window === "undefined") {
    return;
  }

  const now = Date.now();
  if (!force && syncPromise && now - lastSyncAtMs < RESYNC_INTERVAL_MS) {
    return syncPromise;
  }

  syncPromise = (async () => {
    const firestore = getClientFirestore();
    const ref = doc(firestore, "competitions", "main", "system", "clockSync");
    const clientBefore = Date.now();

    await setDoc(ref, { probeAt: serverTimestamp() }, { merge: true });

    const snapshot = await getDoc(ref);
    const probeAt = snapshot.data()?.probeAt;
    if (!probeAt || typeof probeAt.toMillis !== "function") {
      return;
    }

    const serverMs = probeAt.toMillis();
    const clientAfter = Date.now();
    const estimatedRtt = clientAfter - clientBefore;
    offsetMs = serverMs - (clientBefore + estimatedRtt / 2);
    lastSyncAtMs = Date.now();
  })().catch(() => {
    // Keep the previous offset when the probe fails.
  });

  return syncPromise;
}

export async function resolveSyncedNowMs(forceSync = false): Promise<number> {
  await syncServerClockOffset(forceSync);
  return getSyncedNowMs();
}
