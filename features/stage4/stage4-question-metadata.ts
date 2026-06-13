import type { Stage4QuestionMetadata, Stage4QuestionType } from "@/features/stage4/stage4-question-types";

const STAGE4_QUESTION_TYPES: Stage4QuestionType[] = ["link", "image", "who_am_i"];

export function parseStage4QuestionMetadata(value: unknown): Stage4QuestionMetadata | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const data = value as Record<string, unknown>;

  if (
    typeof data.id !== "string" ||
    typeof data.prompt !== "string" ||
    typeof data.correctAnswer !== "string" ||
    !STAGE4_QUESTION_TYPES.includes(data.type as Stage4QuestionType)
  ) {
    return null;
  }

  const question: Stage4QuestionMetadata = {
    id: data.id,
    type: data.type as Stage4QuestionType,
    prompt: data.prompt,
    correctAnswer: data.correctAnswer,
    order: typeof data.order === "number" ? data.order : 0,
  };

  if (typeof data.imageUrl === "string" && data.imageUrl.length > 0) {
    question.imageUrl = data.imageUrl;
  }

  if (typeof data.clue === "string" && data.clue.length > 0) {
    question.clue = data.clue;
  }

  if (typeof data.linkText === "string" && data.linkText.length > 0) {
    question.linkText = data.linkText;
  }

  if (Array.isArray(data.acceptedAnswers)) {
    question.acceptedAnswers = data.acceptedAnswers.filter(
      (item): item is string => typeof item === "string" && item.length > 0,
    );
  }

  return question;
}

export function parseStage4FinishedQuestionIds(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string" && item.length > 0);
}
