import { getStage1QuestionCount } from "@/features/stage1/stage1-question-bank";
import { STAGE2_ARRANGE_VERSE_QUESTION_COUNT } from "@/features/stage2/stage2-arrange-verse-mock-questions";
import { STAGE2_COMPLETE_VERSE_QUESTION_COUNT } from "@/features/stage2/stage2-complete-verse-mock-questions";
import { STAGE2_MATCHING_QUESTION_COUNT } from "@/features/stage2/stage2-matching-mock-questions";
import { STAGE2_TRUE_FALSE_CORRECT_QUESTION_COUNT } from "@/features/stage2/stage2-true-false-correct-mock-questions";
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
    return Math.min(
      STAGE2_MATCHING_QUESTION_COUNT,
      STAGE2_ARRANGE_VERSE_QUESTION_COUNT,
      STAGE2_COMPLETE_VERSE_QUESTION_COUNT,
      STAGE2_TRUE_FALSE_CORRECT_QUESTION_COUNT,
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
