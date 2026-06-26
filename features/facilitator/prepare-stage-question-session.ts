import { doc, getDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { gameFlowRef, MAIN_COMPETITION_ID } from "@/firebase/firestore";
import { getClientFirestore } from "@/firebase/firebaseClient";
import { readActiveSessionId } from "@/features/facilitator/competition-session";
import {
  buildActiveQuestionIndices,
  parseQuestionDisplaySettings,
} from "@/features/facilitator/question-display-settings";
import { fetchCurrentQuestionBankMeta } from "@/features/facilitator/question-bank-meta";
import { getActiveStage1Bank } from "@/features/facilitator/stage1-question-bank-store";
import { getStage4MockQuestions } from "@/features/stage4/stage4-mock-questions";

async function readSessionSeed(prefix: string): Promise<string> {
  const sessionId = await readActiveSessionId();
  return `${prefix}-${sessionId ?? "default"}`;
}

/**
 * عدد أسئلة بنك المرحلة من Firestore مباشرة (وليس من الذاكرة المؤقتة) — لأن المؤقتة
 * قد تكون فارغة على شاشة الميسّر فترجع لبنك افتراضي صغير، فيُحسب العدد خطأً (سبب
 * مشكلة «يظهر 40 ثم 6»).
 */
async function readStoredBankCount(stage: string, fallback: number): Promise<number> {
  try {
    const snapshot = await getDoc(
      doc(getClientFirestore(), "competitions", MAIN_COMPETITION_ID, "questionBanks", stage),
    );
    const questions = snapshot.data()?.questions;
    return Array.isArray(questions) && questions.length > 0 ? questions.length : fallback;
  } catch {
    return fallback;
  }
}

export async function prepareStage1QuestionSession(): Promise<number[]> {
  const [gameFlowSnapshot, meta] = await Promise.all([
    getDoc(gameFlowRef),
    fetchCurrentQuestionBankMeta(),
  ]);
  const bankLength = await readStoredBankCount("stage1", getActiveStage1Bank().length);
  // نستخدم العدد الفعلي للبنك في القصّ أيضاً (لا أحجام البنك القديمة من meta).
  const settings = parseQuestionDisplaySettings(gameFlowSnapshot.data(), {
    ...meta.bankSizes,
    stage1: bankLength,
  });
  const indices = buildActiveQuestionIndices(
    bankLength,
    settings.stage1.displayCount,
    settings.stage1.orderMode,
    await readSessionSeed("stage1"),
  );

  await updateDoc(gameFlowRef, {
    stage1ActiveQuestionIndices: indices,
    updatedAt: serverTimestamp(),
  });

  return indices;
}

export async function prepareStage2QuestionSession(): Promise<{
  indices: number[];
  readingReference: string;
  readingPassage: string;
}> {
  const [gameFlowSnapshot, meta] = await Promise.all([
    getDoc(gameFlowRef),
    fetchCurrentQuestionBankMeta(),
  ]);
  const settings = parseQuestionDisplaySettings(gameFlowSnapshot.data(), meta.bankSizes);
  const bankLength = meta.bankSizes.stage2 ?? 20;
  const indices = buildActiveQuestionIndices(
    bankLength,
    settings.stage2.displayCount,
    settings.stage2.orderMode,
    await readSessionSeed("stage2"),
  );

  const readingReference = meta.stage2ReadingReference || "يوحنا 15: 1-17";
  const readingPassage = meta.stage2ReadingPassage || "";

  await updateDoc(gameFlowRef, {
    stage2ActiveQuestionIndices: indices,
    stage2ReadingReference: readingReference,
    stage2ReadingPassage: readingPassage,
    updatedAt: serverTimestamp(),
  });

  return { indices, readingReference, readingPassage };
}

export async function prepareStage4QuestionSession(): Promise<number[]> {
  const [gameFlowSnapshot, meta] = await Promise.all([
    getDoc(gameFlowRef),
    fetchCurrentQuestionBankMeta(),
  ]);
  const bankLength = await readStoredBankCount("stage4", getStage4MockQuestions().length);
  const settings = parseQuestionDisplaySettings(gameFlowSnapshot.data(), {
    ...meta.bankSizes,
    stage4: bankLength,
  });
  const indices = buildActiveQuestionIndices(
    bankLength,
    settings.stage4.displayCount,
    settings.stage4.orderMode,
    await readSessionSeed("stage4"),
  );

  await updateDoc(gameFlowRef, {
    stage4ActiveQuestionIndices: indices,
    stage4QuestionCount: indices.length,
    updatedAt: serverTimestamp(),
  });

  return indices;
}
