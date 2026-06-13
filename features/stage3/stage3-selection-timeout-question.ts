import type { Stage3QuestionMetadata } from "@/features/stage3/stage3-question-types";

export function buildStage3SelectionTimeoutQuestionId(advanceKey: string): string {
  return `selection-timeout-${advanceKey}`;
}

export function buildStage3SelectionTimeoutQuestionMetadata(
  advanceKey: string,
): Stage3QuestionMetadata {
  return {
    id: buildStage3SelectionTimeoutQuestionId(advanceKey),
    fieldId: "selection_timeout",
    fieldLabel: "اختيار السؤال",
    difficulty: "easy",
    questionNumber: 0,
  };
}

export function isStage3SelectionTimeoutQuestion(
  question: Stage3QuestionMetadata | null | undefined,
): boolean {
  if (!question) {
    return false;
  }

  return (
    question.fieldId === "selection_timeout" ||
    question.id.startsWith("selection-timeout-")
  );
}
