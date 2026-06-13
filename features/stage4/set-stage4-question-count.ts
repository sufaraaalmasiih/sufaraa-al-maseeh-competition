import { serverTimestamp, updateDoc } from "firebase/firestore";
import { gameFlowRef } from "@/firebase/firestore";

export async function setStage4QuestionCount(questionCount: number) {
  const safeCount = Math.max(1, Math.min(15, Math.floor(questionCount)));

  await updateDoc(gameFlowRef, {
    stage4QuestionCount: safeCount,
    updatedAt: serverTimestamp(),
  });
}
