import { serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { gameFlowRef, timerRef } from "@/firebase/firestore";
import { resolveSyncedNowMs } from "@/lib/server-clock-sync";

export async function startStage4Reveal() {
  const now = await resolveSyncedNowMs(true);

  await Promise.all([
    updateDoc(gameFlowRef, {
      status: "stage4_reveal",
      currentStage: "stage4",
      stage4RevealStartedAt: now,
      updatedAt: serverTimestamp(),
    }),
    setDoc(
      timerRef,
      {
        active: false,
        paused: false,
        pausedRemainingMs: 0,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    ),
  ]);
}
