import { runTransaction, serverTimestamp } from "firebase/firestore";
import { firestore } from "@/firebase/firebaseClient";
import { gameFlowRef } from "@/firebase/firestore";
import {
  parseStage4FinishedQuestionIds,
  parseStage4QuestionMetadata,
} from "@/features/stage4/stage4-question-metadata";

export async function advanceStage4Question() {
  await runTransaction(firestore, async (transaction) => {
    const gameFlowSnapshot = await transaction.get(gameFlowRef);

    if (!gameFlowSnapshot.exists()) {
      throw new Error("Game flow document is missing.");
    }

    const gameFlow = gameFlowSnapshot.data();

    if (gameFlow?.status !== "stage4_reveal") {
      throw new Error("Stage 4 can only advance after reveal.");
    }

    const activeQuestion = parseStage4QuestionMetadata(gameFlow.stage4ActiveQuestion);
    const questionIndex =
      typeof gameFlow.stage4QuestionIndex === "number" ? gameFlow.stage4QuestionIndex : 0;
    const questionCount =
      typeof gameFlow.stage4QuestionCount === "number" ? gameFlow.stage4QuestionCount : 15;
    const finishedIds = parseStage4FinishedQuestionIds(gameFlow.stage4FinishedQuestionIds);
    const nextFinishedIds =
      activeQuestion && !finishedIds.includes(activeQuestion.id)
        ? [...finishedIds, activeQuestion.id]
        : finishedIds;
    const nextIndex = questionIndex + 1;
    const isLastQuestion = nextIndex >= questionCount;

    transaction.update(gameFlowRef, {
      status: isLastQuestion ? "stage4_finished" : "stage4_waiting_question",
      currentStage: "stage4",
      stage4QuestionIndex: nextIndex,
      stage4ActiveQuestion: null,
      stage4FinishedQuestionIds: nextFinishedIds,
      stage4RevealStartedAt: 0,
      updatedAt: serverTimestamp(),
    });
  });
}
