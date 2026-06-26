import {
  isStage4FlexibleType,
  type Stage4QuestionMetadata,
  type Stage4QuestionType,
} from "@/features/stage4/stage4-question-types";
import { normalizeStage1ExcelType } from "@/features/facilitator/question-type-registry";
import { normalizeStage4ExcelType } from "@/features/facilitator/question-type-registry";

const STAGE4_LEGACY_TYPES: Stage4QuestionType[] = ["link", "image", "who_am_i"];

function splitList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string" && item.length > 0);
  }

  if (typeof value !== "string") {
    return [];
  }

  return value
    .split(/[|\n;]+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function isStage4QuestionType(value: string): value is Stage4QuestionType {
  return (
    value === "missing" ||
    value === "multiple_choice" ||
    value === "arrange" ||
    value === "fill_blank" ||
    value === "link" ||
    value === "image" ||
    value === "who_am_i"
  );
}

function resolveStage4Type(value: unknown): Stage4QuestionType | null {
  const resolved = normalizeStage4ExcelType(value);
  if (resolved && isStage4QuestionType(resolved)) {
    return resolved;
  }

  const stage1 = normalizeStage1ExcelType(value);
  return stage1 ?? null;
}

export function parseStage4QuestionMetadata(value: unknown): Stage4QuestionMetadata | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const data = value as Record<string, unknown>;
  const type = resolveStage4Type(data.type);

  if (
    !type ||
    typeof data.id !== "string" ||
    typeof data.prompt !== "string" ||
    typeof data.correctAnswer !== "string"
  ) {
    return null;
  }

  const question: Stage4QuestionMetadata = {
    id: data.id,
    type,
    ...(typeof data.typeLabel === "string" && data.typeLabel.trim()
      ? { typeLabel: data.typeLabel.trim() }
      : {}),
    prompt: data.prompt,
    correctAnswer: data.correctAnswer,
    order: typeof data.order === "number" ? data.order : 0,
  };

  if (typeof data.imageUrl === "string" && data.imageUrl.length > 0) {
    question.imageUrl = data.imageUrl;
  }

  if (typeof data.reference === "string" && data.reference.length > 0) {
    question.reference = data.reference;
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

  if (isStage4FlexibleType(type)) {
    if (type === "multiple_choice") {
      const options = splitList(data.options);
      if (options.length < 2) {
        return null;
      }
      question.options = options;
    }

    if (type === "arrange") {
      const parts = splitList(data.parts);
      if (parts.length < 2) {
        return null;
      }
      question.parts = parts;
      const correctOrder = splitList(data.correctOrder);
      if (correctOrder.length > 0) {
        question.correctOrder = correctOrder;
      }
    }
  } else if (!STAGE4_LEGACY_TYPES.includes(type)) {
    return null;
  }

  return question;
}

export function parseStage4FinishedQuestionIds(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string" && item.length > 0);
}
