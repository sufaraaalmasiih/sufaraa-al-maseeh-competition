import { serverTimestamp, updateDoc } from "firebase/firestore";
import { gameFlowRef } from "@/firebase/firestore";
import { prepareStage4QuestionSession } from "@/features/facilitator/prepare-stage-question-session";

interface StartStage4Input {
  questionCount?: number;
}

export async function startStage4(_input: StartStage4Input = {}) {
  const indices = await prepareStage4QuestionSession();

  await updateDoc(gameFlowRef, {
    status: "stage4_waiting_question",
    currentStage: "stage4",
    stage4QuestionIndex: 0,
    stage4QuestionCount: indices.length,
    stage4ActiveQuestion: null,
    stage4FinishedQuestionIds: [],
    stage4RevealStartedAt: 0,
    updatedAt: serverTimestamp(),
  });
}