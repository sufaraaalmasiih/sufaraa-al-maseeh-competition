import { runTransaction, serverTimestamp } from "firebase/firestore";
import { getClientFirestore } from "@/firebase/firebaseClient";
import { gameFlowRef, timerRef } from "@/firebase/firestore";
import { buildStage4AnsweringTimerPayload } from "@/features/gameflow/stage4-answering-timer";
import { parseTimerDurations } from "@/features/facilitator/facilitator-timer-settings";
import { getStage4MockQuestionByIndex } from "@/features/stage4/stage4-mock-questions";
import { resolveStage4BankIndex } from "@/features/stage4/stage4-active-session";
import { parseStage4FinishedQuestionIds } from "@/features/stage4/stage4-question-metadata";

import { resolveSyncedNowMs } from "@/lib/server-clock-sync";

export async function openStage4Question() {
  const now = await resolveSyncedNowMs(true);

  await runTransaction(getClientFirestore(), async (transaction) => {
    const gameFlowSnapshot = await transaction.get(gameFlowRef);

    if (!gameFlowSnapshot.exists()) {
      throw new Error("Game flow document is missing.");
    }

    const gameFlow = gameFlowSnapshot.data();
    const status = gameFlow?.status;

    if (status !== "stage4_waiting_question" && status !== "stage4_intro") {
      throw new Error("Stage 4 question can only be opened while waiting.");
    }

    const questionIndex =
      typeof gameFlow.stage4QuestionIndex === "number" ? gameFlow.stage4QuestionIndex : 0;
    const questionCount =
      typeof gameFlow.stage4QuestionCount === "number" ? gameFlow.stage4QuestionCount : 15;

    if (questionIndex >= questionCount) {
      throw new Error("All Stage 4 questions are finished.");
    }

    const question = getStage4MockQuestionByIndex(resolveStage4BankIndex(questionIndex));
    const finishedIds = parseStage4FinishedQuestionIds(gameFlow.stage4FinishedQuestionIds);

    if (!question) {
      throw new Error("Stage 4 question not found.");
    }

    if (finishedIds.includes(question.id)) {
      throw new Error("This Stage 4 question was already finished.");
    }

    const answerSeconds = parseTimerDurations(gameFlow.durations).stage4Answer;

    transaction.update(gameFlowRef, {
      status: "stage4_question_open",
      currentStage: "stage4",
      stage4ActiveQuestion: question,
      stage4RevealStartedAt: 0,
      updatedAt: serverTimestamp(),
    });

    transaction.set(
      timerRef,
      buildStage4AnsweringTimerPayload(now, serverTimestamp(), answerSeconds),
      { merge: true },
    );
  });
}
