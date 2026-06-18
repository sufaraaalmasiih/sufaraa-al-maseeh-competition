import type { Stage1MockQuestion, Stage1QuestionType } from "@/features/stage1/stage1-types";
import {
  normalizeStage1ExcelType,
  stage1ExcelToInternal,
} from "@/features/facilitator/question-type-registry";
import { parseExcelCorrectOrderList } from "@/lib/excel-pipe-list";

const VALID_TYPES: Stage1QuestionType[] = [
  "missing",
  "multiple_choice",
  "arrange",
  "fill_blank",
];

function str(value: unknown): string {
  return typeof value === "string" ? value.trim() : value == null ? "" : String(value).trim();
}

function splitList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => str(item)).filter(Boolean);
  }
  return str(value)
    .split(/[|\n;]+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function resolveType(value: unknown): Stage1QuestionType | null {
  const excelType = normalizeStage1ExcelType(value);
  if (!excelType) {
    return null;
  }
  const internal = stage1ExcelToInternal(excelType);
  return VALID_TYPES.includes(internal) ? internal : null;
}

/** Validate/normalize a stored or imported question; null when unusable. */
function normalizeQuestion(raw: unknown, fallbackIndex: number): Stage1MockQuestion | null {
  const entry = (raw ?? {}) as Record<string, unknown>;
  const type = resolveType(entry.type);
  const prompt = str(entry.prompt);
  const correctAnswer = str(entry.correctAnswer);

  if (!type || !prompt) {
    return null;
  }

  const id = str(entry.id) || `stage1-import-${fallbackIndex + 1}`;
  const reference = str(entry.reference) || undefined;
  const imageUrl = str(entry.imageUrl) || undefined;

  if (type === "multiple_choice") {
    const options = splitList(entry.options);
    if (options.length < 2 || !correctAnswer) {
      return null;
    }
    return {
      id,
      type,
      prompt,
      ...(reference ? { reference } : {}),
      ...(imageUrl ? { imageUrl } : {}),
      correctAnswer,
      options,
    };
  }

  if (type === "arrange") {
    const parts = splitList(entry.parts);
    if (parts.length < 2) {
      return null;
    }
    const correctOrderFromField = splitList(entry.correctOrder);
    const correctOrderFromAnswer = parseExcelCorrectOrderList(entry.correctAnswer);
    const correctOrder =
      correctOrderFromField.length > 0 ? correctOrderFromField : correctOrderFromAnswer;
    const orderForAnswer = correctOrder.length > 0 ? correctOrder : parts;
    return {
      id,
      type,
      prompt,
      ...(reference ? { reference } : {}),
      ...(imageUrl ? { imageUrl } : {}),
      correctAnswer: orderForAnswer.join(" | "),
      parts,
      correctOrder: orderForAnswer,
    };
  }

  if (!correctAnswer) {
    return null;
  }
  return {
    id,
    type,
    prompt,
    ...(reference ? { reference } : {}),
    ...(imageUrl ? { imageUrl } : {}),
    correctAnswer,
  };
}

export function parseStage1Questions(raw: unknown): Stage1MockQuestion[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw
    .map((entry, index) => normalizeQuestion(entry, index))
    .filter((entry): entry is Stage1MockQuestion => entry !== null);
}

/** Convert spreadsheet rows (xlsx/csv) into validated stage-1 questions. */
export function parseStage1RowsToQuestions(
  rows: Record<string, unknown>[],
): Stage1MockQuestion[] {
  return rows
    .map((row, index) => {
      const lower: Record<string, unknown> = {};
      Object.entries(row).forEach(([key, value]) => {
        lower[key.trim().toLowerCase()] = value;
      });
      return normalizeQuestion(
        {
          id: lower.id,
          type: lower.type ?? lower["النوع"],
          prompt: lower.prompt ?? lower["السؤال"],
          reference: lower.reference ?? lower["الشاهد"] ?? lower["المرجع"],
          correctAnswer:
            lower.correctanswer ?? lower["الإجابة"] ?? lower["الاجابة"] ?? lower.answer,
          options: lower.options ?? lower["الخيارات"],
          parts: lower.parts ?? lower["الأجزاء"] ?? lower["الاجزاء"],
          correctOrder: lower.correctorder ?? lower["الترتيب"],
          imageUrl: lower.imageurl ?? lower["رابط الصورة"] ?? lower["الصورة"],
        },
        index,
      );
    })
    .filter((entry): entry is Stage1MockQuestion => entry !== null);
}
