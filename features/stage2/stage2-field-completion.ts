import {
  getActiveStage2ArrangeVerseQuestions,
  getActiveStage2CompleteVerseQuestions,
  getActiveStage2MatchingQuestions,
  getActiveStage2TrueFalseQuestions,
} from "@/features/facilitator/question-bank-runtime-cache";
import { getStage2FieldByIndex } from "@/features/stage2/stage2-field-sequence";
import type { Stage2RoleKey } from "@/features/stage2/stage2-types";

export function getStage2FieldQuestionCount(fieldKey: Stage2RoleKey): number {
  switch (fieldKey) {
    case "matching":
      return getActiveStage2MatchingQuestions().length;
    case "arrangeVerse":
      return getActiveStage2ArrangeVerseQuestions().length;
    case "completeVerse":
      return getActiveStage2CompleteVerseQuestions().length;
    case "trueFalseCorrect":
      return getActiveStage2TrueFalseQuestions().length;
    default:
      return 0;
  }
}

export function isStage2FieldQuestionsComplete(
  fieldIndex: number,
  questionIndex: number,
  isComplete: boolean,
): boolean {
  if (isComplete) {
    return false;
  }

  const field = getStage2FieldByIndex(fieldIndex);
  if (!field) {
    return false;
  }

  const questionCount = getStage2FieldQuestionCount(field.key);
  return questionCount > 0 && questionIndex >= questionCount;
}
