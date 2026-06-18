import { runTransaction, serverTimestamp } from "firebase/firestore";
import { getClientFirestore } from "@/firebase/firebaseClient";
import { gameFlowRef, timerRef } from "@/firebase/firestore";
import { canCloseStage4AnswersNow } from "@/features/stage4/stage4-answer-window";
import { resolveSyncedNowMs } from "@/lib/server-clock-sync";

export async function closeStage4Answers() {
  const now = await resolveSyncedNowMs(true);

  await runTransaction(getClientFirestore(), async (transaction) => {
    const gameFlowSnapshot = await transaction.get(gameFlowRef);

    if (!gameFlowSnapshot.exists()) {
      throw new Error("Game flow document is missing.");
    }

    const gameFlow = gameFlowSnapshot.data();
    if (gameFlow?.status !== "stage4_question_open") {
      throw new Error("لا يمكن إغلاق الإجابات إلا أثناء فتح السؤال.");
    }

    const openedAtMs =
      typeof gameFlow.stage4QuestionOpenedAtMs === "number"
        ? gameFlow.stage4QuestionOpenedAtMs
        : null;

    if (!canCloseStage4AnswersNow(openedAtMs, now)) {
      throw new Error("يجب انتظار 8 ثوانٍ على الأقل بعد فتح السؤال قبل الإغلاق.");
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
