import { runTransaction, serverTimestamp, setDoc } from "firebase/firestore";
import { firestore } from "@/firebase/firebaseClient";
import { gameFlowRef, timerRef } from "@/firebase/firestore";

/**
 * Locks answers — maps old `answer_closed` state.
 */
export async function closeStage3Answers() {
  await runTransaction(firestore, async (transaction) => {
    const gameFlowSnapshot = await transaction.get(gameFlowRef);

    if (!gameFlowSnapshot.exists()) {
      throw new Error("Game flow document is missing.");
    }

    const gameFlow = gameFlowSnapshot.data();

    if (gameFlow?.status !== "stage3_question_open") {
      throw new Error("Answers can only be closed while a question is open.");
    }

    transaction.update(gameFlowRef, {
      status: "stage3_answer_closed",
      currentStage: "stage3",
      updatedAt: serverTimestamp(),
    });

    transaction.set(
      timerRef,
      {
        active: false,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
  });
}

