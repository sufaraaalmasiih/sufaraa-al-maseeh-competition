import { serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { gameFlowRef, timerRef } from "@/firebase/firestore";

/**
 * Ends reveal display — maps old `results_done` state.
 */
export async function finishStage3Reveal() {
  await Promise.all([
    updateDoc(gameFlowRef, {
      status: "stage3_results_done",
      currentStage: "stage3",
      updatedAt: serverTimestamp(),
    }),
    setDoc(
      timerRef,
      {
        active: false,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    ),
  ]);
}

