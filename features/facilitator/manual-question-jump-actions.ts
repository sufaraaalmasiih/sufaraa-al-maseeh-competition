import {
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { getClientFirestore } from "@/firebase/firebaseClient";
import {
  gameFlowRef,
  MAIN_COMPETITION_ID,
  teamStatesCollectionRef,
  timerRef,
} from "@/firebase/firestore";
import { buildStage4AnsweringTimerPayload } from "@/features/gameflow/stage4-answering-timer";
import { parseTimerDurations } from "@/features/facilitator/facilitator-timer-settings";
import { getStage1QuestionCount } from "@/features/stage1/stage1-question-bank";
import {
  getActiveStage2ArrangeVerseQuestions,
  getActiveStage2CompleteVerseQuestions,
  getActiveStage2MatchingQuestions,
  getActiveStage2TrueFalseQuestions,
} from "@/features/facilitator/question-bank-runtime-cache";
import { getStage4MockQuestionByIndex } from "@/features/stage4/stage4-mock-questions";
import { resolveStage4BankIndex } from "@/features/stage4/stage4-active-session";
import { parseStage4FinishedQuestionIds } from "@/features/stage4/stage4-question-metadata";
import { resolveSyncedNowMs } from "@/lib/server-clock-sync";

const FIRESTORE_BATCH_LIMIT = 500;

export type ManualQuestionJumpStage = "stage1" | "stage2" | "stage4";

async function updateAllTeamProgress(patch: Record<string, unknown>): Promise<void> {
  const snapshot = await getDocs(teamStatesCollectionRef(MAIN_COMPETITION_ID));
  const docs = snapshot.docs;

  for (let index = 0; index < docs.length; index += FIRESTORE_BATCH_LIMIT) {
    const chunk = docs.slice(index, index + FIRESTORE_BATCH_LIMIT);
    const batch = writeBatch(getClientFirestore());
    chunk.forEach((docSnap) => {
      batch.update(docSnap.ref, {
        ...patch,
        updatedAt: serverTimestamp(),
      });
    });
    await batch.commit();
  }
}

function getStage2CurrentFieldQuestionCount(field: unknown): number {
  switch (field) {
    case "arrangeVerse":
      return getActiveStage2ArrangeVerseQuestions().length;
    case "completeVerse":
      return getActiveStage2CompleteVerseQuestions().length;
    case "trueFalseCorrect":
      return getActiveStage2TrueFalseQuestions().length;
    case "matching":
    default:
      return getActiveStage2MatchingQuestions().length;
  }
}

function clampQuestionIndex(questionNumber: number, count: number): number {
  if (!Number.isFinite(questionNumber) || questionNumber < 1) {
    return 0;
  }
  return Math.min(Math.floor(questionNumber) - 1, Math.max(0, count - 1));
}

export async function jumpToManualQuestion(
  stage: ManualQuestionJumpStage,
  questionNumber: number,
): Promise<void> {
  if (stage === "stage1") {
    const count = getStage1QuestionCount();
    await updateAllTeamProgress({
      "progress.stage1QuestionIndex": clampQuestionIndex(questionNumber, count),
    });
    await updateDoc(gameFlowRef, {
      status: "stage1_running",
      currentStage: "stage1",
      updatedAt: serverTimestamp(),
    });
    return;
  }

  if (stage === "stage2") {
    const snapshot = await getDoc(gameFlowRef);
    const currentField = snapshot.data()?.stage2Field || snapshot.data()?.stage2CurrentField || "matching";
    const count = getStage2CurrentFieldQuestionCount(currentField);
    await updateAllTeamProgress({
      "progress.stage2QuestionIndex": clampQuestionIndex(questionNumber, count),
    });
    await updateDoc(gameFlowRef, {
      status: "stage2_player_turns",
      currentStage: "stage2",
      updatedAt: serverTimestamp(),
    });
    return;
  }

  const now = await resolveSyncedNowMs(true);
  const snapshot = await getDoc(gameFlowRef);
  const gameFlow = snapshot.data();
  const questionCount =
    typeof gameFlow?.stage4QuestionCount === "number" ? gameFlow.stage4QuestionCount : 15;
  const questionIndex = clampQuestionIndex(questionNumber, questionCount);
  const question = getStage4MockQuestionByIndex(resolveStage4BankIndex(questionIndex));

  if (!question) {
    throw new Error("Stage 4 question not found.");
  }

  const finishedIds = parseStage4FinishedQuestionIds(gameFlow?.stage4FinishedQuestionIds).filter(
    (id) => id !== question.id,
  );
  const answerSeconds = parseTimerDurations(gameFlow?.durations).stage4Answer;

  await Promise.all([
    updateDoc(gameFlowRef, {
      status: "stage4_question_open",
      currentStage: "stage4",
      stage4QuestionIndex: questionIndex,
      stage4ActiveQuestion: question,
      stage4FinishedQuestionIds: finishedIds,
      stage4QuestionOpenedAtMs: now,
      stage4RevealStartedAt: 0,
      updatedAt: serverTimestamp(),
    }),
    setDoc(
      timerRef,
      buildStage4AnsweringTimerPayload(now, serverTimestamp(), answerSeconds),
      { merge: true },
    ),
  ]);
}
