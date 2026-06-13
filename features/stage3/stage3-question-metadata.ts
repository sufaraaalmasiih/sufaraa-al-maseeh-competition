import type { Stage3BoardQuestion } from "@/features/stage3/stage3-board-data";
import type { Stage3QuestionMetadata } from "@/features/stage3/stage3-question-types";

export function boardQuestionToMetadata(
  question: Stage3BoardQuestion,
  fieldLabel: string,
): Stage3QuestionMetadata {
  return {
    id: question.id,
    fieldId: question.fieldKey,
    fieldLabel,
    difficulty: question.difficulty,
    questionNumber: question.number,
  };
}

export function parseStage3QuestionMetadata(
  value: unknown,
): Stage3QuestionMetadata | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const data = value as Record<string, unknown>;
  const difficulty = data.difficulty;

  if (
    typeof data.id !== "string" ||
    typeof data.fieldId !== "string" ||
    typeof data.fieldLabel !== "string" ||
    typeof data.questionNumber !== "number" ||
    (difficulty !== "easy" && difficulty !== "medium" && difficulty !== "hard")
  ) {
    return null;
  }

  return {
    id: data.id,
    fieldId: data.fieldId,
    fieldLabel: data.fieldLabel,
    difficulty,
    questionNumber: data.questionNumber,
  };
}

export function parseStage3OpenedQuestionIds(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string");
}

export function parseStage3UsedQuestionIds(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string");
}

export function parseStage3OwnerTeamId(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

export function parseStage3OwnerTeamName(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

export function parseStage3OwnerTurnIndex(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}
