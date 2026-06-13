import {
  getStage2FieldByIndex,
  STAGE2_FIELD_COUNT,
  type Stage2FieldMeta,
} from "@/features/stage2/stage2-field-sequence";
import type { Stage2RoleKey } from "@/features/stage2/stage2-types";

export interface Stage2ProgressState {
  stage2FieldIndex: number;
  stage2Field: Stage2RoleKey;
  stage2QuestionIndex: number;
  currentField: Stage2FieldMeta | null;
  isComplete: boolean;
}

const DEFAULT_FIELD_KEY: Stage2RoleKey = "matching";

function normalizeFieldIndex(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.min(Math.trunc(value), STAGE2_FIELD_COUNT));
}

function normalizeQuestionIndex(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.trunc(value));
}

function normalizeFieldKey(value: unknown, fieldIndex: number): Stage2RoleKey {
  const fieldFromIndex = getStage2FieldByIndex(fieldIndex)?.key;

  if (
    typeof value === "string" &&
    (value === "matching" ||
      value === "arrangeVerse" ||
      value === "completeVerse" ||
      value === "trueFalseCorrect")
  ) {
    return value;
  }

  return fieldFromIndex ?? DEFAULT_FIELD_KEY;
}

export function normalizeStage2Progress(
  progress: Record<string, unknown> | undefined,
): Stage2ProgressState {
  const stage2FieldIndex = normalizeFieldIndex(progress?.stage2FieldIndex);
  const isComplete = stage2FieldIndex >= STAGE2_FIELD_COUNT;

  if (isComplete) {
    return {
      stage2FieldIndex,
      stage2Field: DEFAULT_FIELD_KEY,
      stage2QuestionIndex: STAGE2_FIELD_COUNT,
      currentField: null,
      isComplete: true,
    };
  }

  const stage2Field = normalizeFieldKey(progress?.stage2Field, stage2FieldIndex);
  const stage2QuestionIndex = normalizeQuestionIndex(progress?.stage2QuestionIndex);

  return {
    stage2FieldIndex,
    stage2Field,
    stage2QuestionIndex,
    currentField: getStage2FieldByIndex(stage2FieldIndex),
    isComplete: false,
  };
}

export function getStage2ProgressAfterFinish(
  currentFieldIndex: number,
): Pick<
  Stage2ProgressState,
  "stage2FieldIndex" | "stage2Field" | "stage2QuestionIndex"
> {
  const nextFieldIndex = currentFieldIndex + 1;
  const nextField = getStage2FieldByIndex(nextFieldIndex);

  return {
    stage2FieldIndex: nextFieldIndex,
    stage2Field: nextField?.key ?? ("" as Stage2RoleKey),
    stage2QuestionIndex: 0,
  };
}
