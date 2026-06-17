import {
  getDocs,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { getClientFirestore } from "@/firebase/firebaseClient";
import { answersCollectionRef, gameFlowRef, timerRef } from "@/firebase/firestore";
import {
  parseStage3QuestionMetadata,
  parseStage3UsedQuestionIds,
} from "@/features/stage3/stage3-question-metadata";
import { buildStage3RevealTimerPayload } from "@/features/stage3/stage3-timer-payload";
import { parseTimerDurations } from "@/features/facilitator/facilitator-timer-settings";

const MAIN_COMPETITION_ID = "main";

async function markStage3AnswersVisibleToAudience(questionId: string) {
  const answersSnapshot = await getDocs(
    query(
      answersCollectionRef(MAIN_COMPETITION_ID),
      where("stage", "==", "stage3"),
      where("questionId", "==", questionId),
    ),
  );

  if (answersSnapshot.empty) {
    return;
  }

  const batch = writeBatch(getClientFirestore());

  for (const answerDoc of answersSnapshot.docs) {
    batch.update(answerDoc.ref, {
      visibleToAudience: true,
      updatedAt: serverTimestamp(),
    });
  }

  await batch.commit();
}

/**
 * B2: Commit gameFlow → reveal first (blocks late confirms), then load answers
 * and set visibleToAudience so late commits before the transition are included.
 */
export async function startStage3Reveal() {
  const { questionId } = await runTransaction(getClientFirestore(), async (transaction) => {
    const gameFlowSnapshot = await transaction.get(gameFlowRef);
    const gameFlow = gameFlowSnapshot.data();

    if (!gameFlow) {
      throw new Error("Game flow is missing.");
    }

    const status = gameFlow.status;

    if (status !== "stage3_question_open" && status !== "stage3_answer_closed") {
      throw new Error("Reveal is only available after answers are open or closed.");
    }

    const activeQuestion = parseStage3QuestionMetadata(gameFlow.stage3ActiveQuestion);

    if (!activeQuestion) {
      throw new Error("Active question is missing.");
    }

    const usedQuestionIds = parseStage3UsedQuestionIds(gameFlow.stage3UsedQuestionIds);
    const nextUsedIds = usedQuestionIds.includes(activeQuestion.id)
      ? usedQuestionIds
      : [...usedQuestionIds, activeQuestion.id];

    const now = Date.now();
    const revealSeconds = parseTimerDurations(gameFlow.durations).stage3Reveal;

    transaction.update(gameFlowRef, {
      status: "stage3_reveal",
      currentStage: "stage3",
      stage3UsedQuestionIds: nextUsedIds,
      updatedAt: serverTimestamp(),
    });

    transaction.set(
      timerRef,
      buildStage3RevealTimerPayload(now, serverTimestamp(), revealSeconds),
      { merge: true },
    );

    return { questionId: activeQuestion.id };
  });

  await markStage3AnswersVisibleToAudience(questionId);
}
