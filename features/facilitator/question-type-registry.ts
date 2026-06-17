import type { Stage1QuestionType } from "@/features/stage1/stage1-types";
import type { Stage2RoleKey } from "@/features/stage2/stage2-types";
import type { Stage4QuestionType } from "@/features/stage4/stage4-question-types";

/** القيم الرسمية لعمود type في Excel — يجب أن تطابق المشروع حرفياً. */
export const STAGE1_EXCEL_TYPES = [
  "missing",
  "multiple_choice",
  "arrange",
  "fill_blank",
] as const;

export const STAGE2_EXCEL_TYPES = [
  "matching",
  "arrangeVerse",
  "completeVerse",
  "trueFalseCorrect",
] as const;

/** المرحلة الثالثة والرابعة: كل أنواع الأسئلة في اللعبة. */
export const ALL_GAME_QUESTION_TYPES = [
  ...STAGE1_EXCEL_TYPES,
  ...STAGE2_EXCEL_TYPES,
  "link",
  "image",
  "who_am_i",
] as const;

export type AllGameQuestionType = (typeof ALL_GAME_QUESTION_TYPES)[number];

export const STAGE3_EXCEL_TYPES = ALL_GAME_QUESTION_TYPES;

export const STAGE3_FIELD_KEYS = [
  "characters",
  "miracles",
  "parables",
  "timePlace",
  "numbers",
] as const;

export const STAGE3_LEVELS = ["easy", "medium", "hard"] as const;

export const STAGE4_EXCEL_TYPES = ALL_GAME_QUESTION_TYPES;

export type Stage1ExcelType = (typeof STAGE1_EXCEL_TYPES)[number];
export type Stage2ExcelType = (typeof STAGE2_EXCEL_TYPES)[number];
export type Stage3ExcelType = AllGameQuestionType;
export type Stage4ExcelType = AllGameQuestionType;

export const STAGE1_TYPE_LABELS: Record<Stage1ExcelType, string> = {
  missing: "ماذا ينقص",
  multiple_choice: "اختر من متعدد",
  arrange: "رتّب",
  fill_blank: "فراغات",
};

export const STAGE2_TYPE_LABELS: Record<Stage2ExcelType, string> = {
  matching: "توصيل",
  arrangeVerse: "رتّب الآية أو الآيات",
  completeVerse: "أكمل الآيات",
  trueFalseCorrect: "صح أو خطأ مع تصحيح",
};

export const STAGE3_TYPE_LABELS: Record<AllGameQuestionType, string> = {
  ...STAGE1_TYPE_LABELS,
  ...STAGE2_TYPE_LABELS,
  link: "الرابط العجيب",
  image: "صورة",
  who_am_i: "من أنا",
};

export const STAGE3_FIELD_LABELS: Record<(typeof STAGE3_FIELD_KEYS)[number], string> = {
  characters: "شخصيات",
  miracles: "معجزات",
  parables: "أمثال",
  timePlace: "زمان ومكان",
  numbers: "أعداد",
};

export const STAGE3_LEVEL_LABELS: Record<(typeof STAGE3_LEVELS)[number], string> = {
  easy: "سهل",
  medium: "متوسط",
  hard: "صعب",
};

export const STAGE4_TYPE_LABELS: Record<AllGameQuestionType, string> = {
  ...STAGE3_TYPE_LABELS,
};

export const STAGE1_TYPE_ALIASES: Record<string, Stage1ExcelType> = {
  missing: "missing",
  "ماذا ينقص": "missing",
  "ماذاينقص": "missing",
  multiple_choice: "multiple_choice",
  choice: "multiple_choice",
  mcq: "multiple_choice",
  multiple: "multiple_choice",
  select: "multiple_choice",
  "اختر من متعدد": "multiple_choice",
  "اخترمنمتعدد": "multiple_choice",
  arrange: "arrange",
  رتب: "arrange",
  "رتّب": "arrange",
  fill_blank: "fill_blank",
  fill: "fill_blank",
  blank: "fill_blank",
  فراغات: "fill_blank",
  "أكمل الفراغات": "fill_blank",
  "اكمل الفراغات": "fill_blank",
};

export const STAGE2_TYPE_ALIASES: Record<string, Stage2ExcelType> = {
  matching: "matching",
  توصيل: "matching",
  arrangeverse: "arrangeVerse",
  arrange: "arrangeVerse",
  completeverse: "completeVerse",
  complete: "completeVerse",
  أكمل: "completeVerse",
  "أكمل الآيات": "completeVerse",
  "اكمل الآيات": "completeVerse",
  truefalsecorrect: "trueFalseCorrect",
  truefalse: "trueFalseCorrect",
  "صح أو خطأ": "trueFalseCorrect",
  "صح او خطأ": "trueFalseCorrect",
  correct: "trueFalseCorrect",
  "صح أو خطأ مع تصحيح": "trueFalseCorrect",
  "رتّب الآية أو الآيات": "arrangeVerse",
  "رتب الآية أو الآيات": "arrangeVerse",
};

function compactKey(value: string): string {
  return value.trim().toLowerCase().replace(/[\sـ]+/g, "");
}

export const STAGE4_TYPE_ALIASES: Record<string, AllGameQuestionType> = {
  ...STAGE1_TYPE_ALIASES,
  link: "link",
  "الرابط العجيب": "link",
  image: "image",
  صورة: "image",
  صور: "image",
  who_am_i: "who_am_i",
  whoami: "who_am_i",
  "من أنا": "who_am_i",
  "من انا": "who_am_i",
};

export const STAGE3_LEGACY_TYPE_ALIASES: Record<string, AllGameQuestionType> = {
  board: "multiple_choice",
  "لوحة على المحك": "multiple_choice",
  "لوحةعلىالمحك": "multiple_choice",
};

export function getArabicLabelForExcelType(type: AllGameQuestionType): string {
  return STAGE3_TYPE_LABELS[type];
}

export function normalizeStage3ExcelType(value: unknown): AllGameQuestionType | null {
  const stage1 = normalizeStage1ExcelType(value);
  if (stage1) {
    return stage1;
  }
  const stage2 = normalizeStage2ExcelType(value);
  if (stage2) {
    return stage2;
  }
  const legacy = normalizeStage4LegacyExcelType(value);
  if (legacy) {
    return legacy;
  }

  const raw = String(value ?? "").trim();
  const lower = raw.toLowerCase();
  const compact = compactKey(raw);

  if (STAGE3_LEGACY_TYPE_ALIASES[raw]) {
    return STAGE3_LEGACY_TYPE_ALIASES[raw];
  }
  if (STAGE3_LEGACY_TYPE_ALIASES[lower]) {
    return STAGE3_LEGACY_TYPE_ALIASES[lower];
  }
  if (STAGE3_LEGACY_TYPE_ALIASES[compact]) {
    return STAGE3_LEGACY_TYPE_ALIASES[compact];
  }

  return null;
}

function normalizeStage4LegacyExcelType(value: unknown): "link" | "image" | "who_am_i" | null {
  const raw = String(value ?? "").trim().toLowerCase();
  const compact = compactKey(raw);
  if (STAGE4_TYPE_ALIASES[raw] && ["link", "image", "who_am_i"].includes(STAGE4_TYPE_ALIASES[raw])) {
    return STAGE4_TYPE_ALIASES[raw] as "link" | "image" | "who_am_i";
  }
  if (STAGE4_TYPE_ALIASES[compact] && ["link", "image", "who_am_i"].includes(STAGE4_TYPE_ALIASES[compact])) {
    return STAGE4_TYPE_ALIASES[compact] as "link" | "image" | "who_am_i";
  }
  if (raw === "link" || raw === "image" || raw === "who_am_i") {
    return raw;
  }
  return null;
}

export function normalizeStage1ExcelType(value: unknown): Stage1ExcelType | null {
  const raw = String(value ?? "").trim();
  const lower = raw.toLowerCase();
  const compact = compactKey(raw);
  if (STAGE1_TYPE_ALIASES[raw]) {
    return STAGE1_TYPE_ALIASES[raw];
  }
  if (STAGE1_TYPE_ALIASES[lower]) {
    return STAGE1_TYPE_ALIASES[lower];
  }
  if (STAGE1_TYPE_ALIASES[compact]) {
    return STAGE1_TYPE_ALIASES[compact];
  }
  return STAGE1_EXCEL_TYPES.includes(lower as Stage1ExcelType) ? (lower as Stage1ExcelType) : null;
}

export function normalizeStage2ExcelType(value: unknown): Stage2ExcelType | null {
  const raw = String(value ?? "").trim();
  const lower = raw.toLowerCase();
  const compact = compactKey(raw);
  if (STAGE2_TYPE_ALIASES[lower]) {
    return STAGE2_TYPE_ALIASES[lower];
  }
  if (STAGE2_TYPE_ALIASES[compact]) {
    return STAGE2_TYPE_ALIASES[compact];
  }
  if (STAGE2_TYPE_ALIASES[raw]) {
    return STAGE2_TYPE_ALIASES[raw];
  }
  return STAGE2_EXCEL_TYPES.includes(raw as Stage2ExcelType) ? (raw as Stage2ExcelType) : null;
}

export function normalizeStage4ExcelType(value: unknown): AllGameQuestionType | null {
  const stage1 = normalizeStage1ExcelType(value);
  if (stage1) {
    return stage1;
  }
  const stage2 = normalizeStage2ExcelType(value);
  if (stage2) {
    return stage2;
  }
  const legacy = normalizeStage4LegacyExcelType(value);
  if (legacy) {
    return legacy;
  }

  const raw = String(value ?? "").trim().toLowerCase();
  return ALL_GAME_QUESTION_TYPES.includes(raw as AllGameQuestionType)
    ? (raw as AllGameQuestionType)
    : null;
}

export function stage1ExcelToInternal(type: Stage1ExcelType): Stage1QuestionType {
  return type;
}

export function stage2ExcelToRoleKey(type: Stage2ExcelType): Stage2RoleKey {
  return type;
}

export function stage3ExcelToInternal(type: AllGameQuestionType): Stage1QuestionType | Stage2RoleKey | Stage4QuestionType {
  return type;
}

export function stage4ExcelToInternal(type: AllGameQuestionType): Stage4QuestionType {
  return type as Stage4QuestionType;
}

export function buildOfficialTypeListRows(): QuestionTypeListRow[] {
  const rows: QuestionTypeListRow[] = [];

  STAGE1_EXCEL_TYPES.forEach((type) => {
    rows.push({
      stage: "stage1",
      stageName: "اجمعوا الكنوز",
      type,
      typeName: STAGE1_TYPE_LABELS[type],
      notes: "المرحلة الأولى فقط",
    });
  });

  STAGE2_EXCEL_TYPES.forEach((type) => {
    rows.push({
      stage: "stage2",
      stageName: "فتشوا الكتب",
      type,
      typeName: STAGE2_TYPE_LABELS[type],
      notes: "مجال واحد لكل نوع — 4 مجالات في المرحلة",
    });
  });

  STAGE3_EXCEL_TYPES.forEach((type) => {
    rows.push({
      stage: "stage3",
      stageName: "على المحك",
      type,
      typeName: STAGE3_TYPE_LABELS[type],
      notes: "كل الأنواع مسموحة · category + level مطلوبان",
    });
  });

  STAGE4_EXCEL_TYPES.forEach((type) => {
    rows.push({
      stage: "stage4",
      stageName: "اثبتوا بالحق",
      type,
      typeName: STAGE4_TYPE_LABELS[type],
      notes: "كل الأنواع مسموحة في المرحلة الرابعة",
    });
  });

  return rows;
}

export interface QuestionTypeListRow {
  stage: string;
  stageName: string;
  type: string;
  typeName: string;
  notes: string;
}

/** خيارات القائمة المنسدلة العربية لعمود «نوع السؤال» في Excel. */
export function getStage1ArabicTypeOptions(): string[] {
  return STAGE1_EXCEL_TYPES.map((type) => STAGE1_TYPE_LABELS[type]);
}

export function getStage2ArabicTypeOptions(): string[] {
  return STAGE2_EXCEL_TYPES.map((type) => STAGE2_TYPE_LABELS[type]);
}

export function getStage3ArabicTypeOptions(): string[] {
  return ALL_GAME_QUESTION_TYPES.map((type) => STAGE3_TYPE_LABELS[type]);
}

export function getStage4ArabicTypeOptions(): string[] {
  return ALL_GAME_QUESTION_TYPES.map((type) => STAGE4_TYPE_LABELS[type]);
}

export function getAllArabicTypeOptions(): string[] {
  return ALL_GAME_QUESTION_TYPES.map((type) => STAGE3_TYPE_LABELS[type]);
}

export function getStage3ArabicFieldOptions(): string[] {
  return STAGE3_FIELD_KEYS.map((key) => STAGE3_FIELD_LABELS[key]);
}

export function getStage3ArabicLevelOptions(): string[] {
  return STAGE3_LEVELS.map((level) => STAGE3_LEVEL_LABELS[level]);
}
