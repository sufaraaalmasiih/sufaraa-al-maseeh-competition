import { serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { gameFlowRef, timerRef } from "@/firebase/firestore";

export async function closeStage4Answers() {
  await Promise.all([
    updateDoc(gameFlowRef, {
      status: "stage4_answers_closed",
      currentStage: "stage4",
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
