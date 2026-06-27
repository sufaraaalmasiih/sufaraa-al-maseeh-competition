import { getStage1QuestionCount } from "@/features/stage1/stage1-question-bank";
import {
  getActiveStage2ArrangeVerseQuestions,
  getActiveStage2CompleteVerseQuestions,
  getActiveStage2MatchingQuestions,
  getActiveStage2TrueFalseQuestions,
} from "@/features/facilitator/question-bank-runtime-cache";
import { getStage4MockQuestions } from "@/features/stage4/stage4-mock-questions";

export type OverrideQuestionScope = "stage1" | "stage2" | "stage4";

export function getOverrideQuestionMax(
  scope: OverrideQuestionScope,
  stage4ConfiguredCount: number,
): number {
  if (scope === "stage1") {
    return getStage1QuestionCount();
  }

  if (scope === "stage2") {
    return Math.max(
      getActiveStage2MatchingQuestions().length,
      getActiveStage2ArrangeVerseQuestions().length,
      getActiveStage2CompleteVerseQuestions().length,
      getActiveStage2TrueFalseQuestions().length,
    );
  }

  return Math.min(stage4ConfiguredCount, getStage4MockQuestions().length);
}

export function validateOverrideQuestionNumber(
  scope: OverrideQuestionScope,
  questionNumber: number,
  stage4ConfiguredCount: number,
): { valid: boolean; max: number; message: string | null } {
  const max = getOverrideQuestionMax(scope, stage4ConfiguredCount);

  if (!Number.isFinite(questionNumber) || questionNumber < 1) {
    return {
      valid: false,
      max,
      message: "أدخل رقم سؤال صحيحاً (يبدأ من 1).",
    };
  }

  if (questionNumber > max) {
    return {
      valid: false,
      max,
      message: `رقم السؤال ${questionNumber} أكبر من العدد المتاح (${max} سؤال). عدّل الرقم ثم أعد المحاولة.`,
    };
  }

  return { valid: true, max, message: null };
}

export function overrideQuestionNumberToIndex(questionNumber: number): number {
  return Math.max(0, Math.floor(questionNumber) - 1);
}
