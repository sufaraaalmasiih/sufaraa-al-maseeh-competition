import { runTransaction, serverTimestamp } from "firebase/firestore";
import { getClientFirestore } from "@/firebase/firebaseClient";
import { gameFlowRef, timerRef } from "@/firebase/firestore";
import { resolveSyncedNowMs } from "@/lib/server-clock-sync";

export async function startStage4Reveal() {
  const now = await resolveSyncedNowMs(true);

  await runTransaction(getClientFirestore(), async (transaction) => {
    const gameFlowSnapshot = await transaction.get(gameFlowRef);

    if (!gameFlowSnapshot.exists()) {
      throw new Error("Game flow document is missing.");
    }

    const gameFlow = gameFlowSnapshot.data();
    if (gameFlow?.status !== "stage4_answers_closed") {
      throw new Error("لا يمكن بدء الإعلان قبل إغلاق الإجابات.");
    }

    transaction.update(gameFlowRef, {
      status: "stage4_reveal",
      currentStage: "stage4",
      stage4RevealStartedAt: now,
      updatedAt: serverTimestamp(),
    });
    transaction.set(
      timerRef,
      {
        active: false,
        paused: false,
        pausedRemainingMs: 0,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
  });
}
