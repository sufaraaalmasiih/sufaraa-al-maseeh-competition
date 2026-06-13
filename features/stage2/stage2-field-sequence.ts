import type { Stage2RoleKey } from "@/features/stage2/stage2-types";

export interface Stage2FieldMeta {
  key: Stage2RoleKey;
  label: string;
  order: number;
}

export const STAGE2_FIELD_SEQUENCE: Stage2FieldMeta[] = [
  { key: "matching", label: "توصيل", order: 1 },
  { key: "arrangeVerse", label: "رتّب الآية أو الآيات", order: 2 },
  { key: "completeVerse", label: "أكمل الآيات", order: 3 },
  { key: "trueFalseCorrect", label: "صح أو خطأ مع تصحيح", order: 4 },
];

export const STAGE2_FIELD_COUNT = STAGE2_FIELD_SEQUENCE.length;

export function getStage2FieldByIndex(index: number): Stage2FieldMeta | null {
  if (index < 0 || index >= STAGE2_FIELD_COUNT) {
    return null;
  }

  return STAGE2_FIELD_SEQUENCE[index] ?? null;
}

export function getStage2NextField(
  index: number,
): { field: Stage2FieldMeta; index: number } | null {
  const nextIndex = index + 1;
  const field = getStage2FieldByIndex(nextIndex);

  if (!field) {
    return null;
  }

  return { field, index: nextIndex };
}

export function isStage2FieldsComplete(index: number): boolean {
  return index >= STAGE2_FIELD_COUNT;
}
