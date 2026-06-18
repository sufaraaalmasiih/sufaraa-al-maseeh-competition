import { runTransaction, serverTimestamp } from "firebase/firestore";
import { getClientFirestore } from "@/firebase/firebaseClient";
import { gameFlowRef, timerRef } from "@/firebase/firestore";

export async function closeStage4Answers() {
  await runTransaction(getClientFirestore(), async (transaction) => {
    const gameFlowSnapshot = await transaction.get(gameFlowRef);

    if (!gameFlowSnapshot.exists()) {
      throw new Error("Game flow document is missing.");
    }

    const gameFlow = gameFlowSnapshot.data();
    if (gameFlow?.status !== "stage4_question_open") {
      throw new Error("لا يمكن إغلاق الإجابات إلا أثناء فتح السؤال.");
    }

    transaction.update(gameFlowRef, {
      status: "stage4_answers_closed",
      currentStage: "stage4",
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
