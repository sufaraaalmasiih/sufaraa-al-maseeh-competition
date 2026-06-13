import { getDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { gameFlowRef } from "@/firebase/firestore";
import { STAGE4_DEFAULT_QUESTION_COUNT } from "@/features/stage4/stage4-constants";

interface StartStage4Input {
  questionCount?: number;
}

export async function startStage4({ questionCount }: StartStage4Input = {}) {
  let safeCount = questionCount;

  if (safeCount === undefined) {
    const snapshot = await getDoc(gameFlowRef);
    const stored = snapshot.data()?.stage4QuestionCount;
    safeCount =
      typeof stored === "number" && Number.isFinite(stored)
        ? stored
        : STAGE4_DEFAULT_QUESTION_COUNT;
  }

  safeCount = Math.max(1, Math.min(15, Math.floor(safeCount)));

  await updateDoc(gameFlowRef, {
    status: "stage4_waiting_question",
    currentStage: "stage4",
    stage4QuestionIndex: 0,
    stage4QuestionCount: safeCount,
    stage4ActiveQuestion: null,
    stage4FinishedQuestionIds: [],
    stage4RevealStartedAt: 0,
    updatedAt: serverTimestamp(),
  });
}
