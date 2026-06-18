"use client";

import { runTransaction, serverTimestamp, updateDoc } from "firebase/firestore";
import { getClientFirestore } from "@/firebase/firebaseClient";
import { answerRef, teamStateRef } from "@/firebase/firestore";

const MAIN_COMPETITION_ID = "main";
const STEP_POINTS = 5;
const FULL_POINTS = 15;

/** خطوات تحكيم الميسّر لإجابة «صح أو خطأ مع تصحيح» الخاطئة (النقطة 7). */
export const STAGE2_GRADE_STEP_FIELDS = {
  markedWrong: "facilitatorMarkedWrong",
  wrongPart: "wrongPartIdentified",
  correction: "correctionApproved",
} as const;

export type Stage2GradeStep = keyof typeof STAGE2_GRADE_STEP_FIELDS;

/**
 * يضبط خطوة تحكيم واحدة (±5 نقاط) ويحدّث نقاط الفريق بفرق النقاط مباشرة.
 * إجمالي الخطوات الثلاث = 15 نقطة (كاملة).
 */
export async function setStage2TrueFalseGradeStep(input: {
  answerId: string;
  step: Stage2GradeStep;
  value: boolean;
}): Promise<void> {
  const answerDocRef = answerRef(MAIN_COMPETITION_ID, input.answerId);

  await runTransaction(getClientFirestore(), async (transaction) => {
    const answerSnapshot = await transaction.get(answerDocRef);
    if (!answerSnapshot.exists()) {
      throw new Error("الإجابة غير موجودة.");
    }

    const data = answerSnapshot.data();
    const teamId = typeof data.teamId === "string" ? data.teamId : null;

    const flags = {
      facilitatorMarkedWrong: data.facilitatorMarkedWrong === true,
      wrongPartIdentified: data.wrongPartIdentified === true,
      correctionApproved: data.correctionApproved === true,
    };
    const field = STAGE2_GRADE_STEP_FIELDS[input.step];
    flags[field] = input.value;

    const trueCount = Object.values(flags).filter(Boolean).length;
    const newDelta = trueCount * STEP_POINTS;
    const oldDelta = typeof data.pointsDelta === "number" ? data.pointsDelta : 0;
    const scoreDelta = newDelta - oldDelta;

    // كل القراءات قبل أي كتابة (شرط معاملات Firestore).
    const teamStateDocRef = teamId ? teamStateRef(MAIN_COMPETITION_ID, teamId) : null;
    const teamStateSnapshot =
      teamStateDocRef && scoreDelta !== 0 ? await transaction.get(teamStateDocRef) : null;

    transaction.update(answerDocRef, {
      [field]: input.value,
      pointsDelta: newDelta,
      isCorrect: newDelta >= FULL_POINTS,
      updatedAt: serverTimestamp(),
    });

    if (teamStateDocRef && teamStateSnapshot?.exists()) {
      const teamState = teamStateSnapshot.data();
      const currentStage2 =
        typeof teamState.stageScores?.stage2 === "number"
          ? teamState.stageScores.stage2
          : 0;
      const currentTotal =
        typeof teamState.totalScore === "number" ? teamState.totalScore : 0;
      transaction.update(teamStateDocRef, {
        "stageScores.stage2": currentStage2 + scoreDelta,
        totalScore: currentTotal + scoreDelta,
        updatedAt: serverTimestamp(),
      });
    }
  });
}

/** إنهاء تحكيم الإجابة وإخراجها من قائمة الانتظار. */
export async function finalizeStage2TrueFalseGrading(answerId: string): Promise<void> {
  await updateDoc(answerRef(MAIN_COMPETITION_ID, answerId), {
    gradingComplete: true,
    updatedAt: serverTimestamp(),
  });
}
