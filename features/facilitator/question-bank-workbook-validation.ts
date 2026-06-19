import type { AdminStageKey } from "@/features/facilitator/facilitator-team-admin";
import { getStageDisplayLabel } from "@/features/facilitator/question-display-settings";
import {
  STAGE3_FIELD_KEYS,
  STAGE3_FIELD_LABELS,
  STAGE3_LEVEL_LABELS,
  STAGE3_LEVELS,
  getArabicLabelForExcelType,
  getStage1ArabicTypeOptions,
  getStage2ArabicTypeOptions,
  getStage3ArabicTypeOptions,
  getStage4ArabicTypeOptions,
  normalizeStage1ExcelType,
  normalizeStage2ExcelType,
  normalizeStage3ExcelType,
  normalizeStage4ExcelType,
  type AllGameQuestionType,
} from "@/features/facilitator/question-type-registry";

/** الأنواع العربية المسموحة لكل مرحلة — تُعرض في رسالة الخطأ لتسهيل النقل بين المراحل (#6). */
function getAllowedArabicTypesForStage(stage: AdminStageKey): string[] {
  if (stage === "stage1") {
    return getStage1ArabicTypeOptions();
  }
  if (stage === "stage2") {
    return getStage2ArabicTypeOptions();
  }
  if (stage === "stage3") {
    return getStage3ArabicTypeOptions();
  }
  return getStage4ArabicTypeOptions();
}

function trim(value: unknown): string {
  return typeof value === "string" ? value.trim() : value == null ? "" : String(value).trim();
}

function splitPipeList(value: unknown): string[] {
  const text = trim(value);
  if (!text) {
    return [];
  }
  return text
    .split(/[|,;،\n]+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function collectOptions(row: Record<string, unknown>): string[] {
  const fromColumns = [row.option1, row.option2, row.option3, row.option4].map(trim).filter(Boolean);
  if (fromColumns.length > 0) {
    return fromColumns;
  }
  return splitPipeList(row.options);
}

export interface WorkbookValidationError {
  row: number;
  id: string;
  stage: string;
  field: string;
  message: string;
}

export interface StageTypeBreakdown {
  typeLabel: string;
  count: number;
}

export interface StageValidationSummary {
  stage: AdminStageKey;
  stageLabel: string;
  totalQuestions: number;
  types: StageTypeBreakdown[];
}

export interface WorkbookValidationWarning {
  row: number;
  id: string;
  stage: string;
  field: string;
  message: string;
}

export interface WorkbookPreviewSample {
  stage: string;
  stageLabel: string;
  id: string;
  typeLabel: string;
  promptPreview: string;
  hasImage: boolean;
}

export interface WorkbookValidationReport {
  valid: boolean;
  totalRows: number;
  totalValidQuestions: number;
  errors: WorkbookValidationError[];
  warnings: WorkbookValidationWarning[];
  previewSamples: WorkbookPreviewSample[];
  stages: StageValidationSummary[];
}

function pushWarning(
  warnings: WorkbookValidationWarning[],
  rowNumber: number,
  row: Record<string, unknown>,
  field: string,
  message: string,
) {
  warnings.push({
    row: rowNumber,
    id: trim(row.id) || "—",
    stage: trim(row.stage) || "—",
    field,
    message,
  });
}

function collectTypeWarnings(
  warnings: WorkbookValidationWarning[],
  rowNumber: number,
  row: Record<string, unknown>,
  type: AllGameQuestionType,
) {
  const imageUrl = trim(row.imageurl) || trim(row.image);
  const dataParts = splitPipeList(row.data);

  if (type === "image" && !imageUrl) {
    pushWarning(warnings, rowNumber, row, "رابط الصورة", "نوع «صورة» بدون رابط — يُفضّل إضافة imageUrl.");
  }

  if ((type === "arrange" || type === "arrangeVerse") && dataParts.length > 8) {
    pushWarning(
      warnings,
      rowNumber,
      row,
      "المعطيات",
      `سؤال رتّب يحتوي ${dataParts.length} أجزاء — قد يكون صعباً على الشاشة.`,
    );
  }

  if (type === "who_am_i" && !trim(row.data)) {
    pushWarning(warnings, rowNumber, row, "المعطيات", "نوع «من أنا» بدون تلميح في عمود المعطيات.");
  }
}

function normalizeStage3Field(value: unknown): (typeof STAGE3_FIELD_KEYS)[number] | null {
  const raw = trim(value);
  if (!raw) {
    return null;
  }
  const compact = raw.replace(/\s+/g, "");
  const byKey = STAGE3_FIELD_KEYS.find((key) => key === raw || key === compact);
  if (byKey) {
    return byKey;
  }
  const byLabel = STAGE3_FIELD_KEYS.find(
    (key) => STAGE3_FIELD_LABELS[key] === raw || STAGE3_FIELD_LABELS[key].replace(/\s+/g, "") === compact,
  );
  return byLabel ?? null;
}

function normalizeStage3Level(value: unknown): (typeof STAGE3_LEVELS)[number] | null {
  const raw = trim(value);
  if (!raw) {
    return null;
  }
  const compact = raw.replace(/\s+/g, "");
  const byKey = STAGE3_LEVELS.find((level) => level === raw || level === compact);
  if (byKey) {
    return byKey;
  }
  const byLabel = STAGE3_LEVELS.find(
    (level) => STAGE3_LEVEL_LABELS[level] === raw || STAGE3_LEVEL_LABELS[level].replace(/\s+/g, "") === compact,
  );
  return byLabel ?? null;
}

function resolveTypeForStage(
  stage: AdminStageKey,
  rawType: unknown,
): AllGameQuestionType | null {
  if (stage === "stage1") {
    return normalizeStage1ExcelType(rawType);
  }
  if (stage === "stage2") {
    return normalizeStage2ExcelType(rawType);
  }
  if (stage === "stage3") {
    return normalizeStage3ExcelType(rawType);
  }
  return normalizeStage4ExcelType(rawType);
}

function isRowEmpty(row: Record<string, unknown>): boolean {
  return (
    !trim(row.id) &&
    !trim(row.question) &&
    !trim(row.prompt) &&
    !trim(row.correct) &&
    !trim(row.stage)
  );
}

function pushError(
  errors: WorkbookValidationError[],
  rowNumber: number,
  row: Record<string, unknown>,
  field: string,
  message: string,
) {
  errors.push({
    row: rowNumber,
    id: trim(row.id) || "—",
    stage: trim(row.stage) || "—",
    field,
    message,
  });
}

function validateTypeRequirements(
  errors: WorkbookValidationError[],
  rowNumber: number,
  row: Record<string, unknown>,
  type: AllGameQuestionType,
) {
  const question = trim(row.question) || trim(row.prompt);
  const correct = trim(row.correct) || trim(row.correctanswer) || trim(row.answer);
  const dataParts = splitPipeList(row.data);
  const options = collectOptions(row);
  const imageUrl = trim(row.imageurl) || trim(row.image);

  if (!question) {
    pushError(errors, rowNumber, row, "السؤال", "نص السؤال مطلوب.");
  }

  if (type === "arrange" || type === "arrangeVerse") {
    const parts = dataParts.length >= 2 ? dataParts : options;
    if (parts.length < 2) {
      pushError(
        errors,
        rowNumber,
        row,
        "المعطيات",
        `نوع «${getArabicLabelForExcelType(type)}» يحتاج جزأين على الأقل للترتيب — املأ عمود «المعطيات» بصيغة: جزء1 | جزء2 | جزء3`,
      );
    }
    if (!correct && parts.length >= 2) {
      pushError(
        errors,
        rowNumber,
        row,
        "الإجابة الصحيحة",
        "حدّد الترتيب الصحيح في عمود الإجابة (مفصولة بـ |).",
      );
    }
    return;
  }

  if (type === "multiple_choice") {
    if (options.length < 2) {
      pushError(
        errors,
        rowNumber,
        row,
        "الخيارات",
        "نوع «اختر من متعدد» يحتاج خيارين على الأقل في أعمدة خيار 1–4.",
      );
    }
    if (!correct) {
      pushError(errors, rowNumber, row, "الإجابة الصحيحة", "الإجابة الصحيحة مطلوبة.");
    } else if (options.length >= 2 && !options.includes(correct)) {
      pushError(
        errors,
        rowNumber,
        row,
        "الإجابة الصحيحة",
        `الإجابة «${correct}» يجب أن تطابق أحد الخيارات المذكورة.`,
      );
    }
    return;
  }

  if (type === "matching") {
    if (!correct) {
      pushError(
        errors,
        rowNumber,
        row,
        "الإجابة الصحيحة",
        "نوع «توصيل» يحتاج الإجابة الصحيحة (الطرف الأيمن المطابق).",
      );
    }
    if (!question && !trim(row.data)) {
      pushError(errors, rowNumber, row, "السؤال", "أدخل نص الطرف الأيسر في عمود السؤال.");
    }
    return;
  }

  if (type === "completeVerse" || type === "missing" || type === "fill_blank") {
    if (!correct) {
      pushError(errors, rowNumber, row, "الإجابة الصحيحة", "الإجابة الصحيحة مطلوبة.");
    }
    return;
  }

  if (type === "trueFalseCorrect") {
    const normalized = correct.toLowerCase();
    if (!correct || (normalized !== "صح" && normalized !== "خطأ" && normalized !== "true" && normalized !== "false")) {
      pushError(
        errors,
        rowNumber,
        row,
        "الإجابة الصحيحة",
        "نوع «صح أو خطأ» يحتاج الإجابة: صح أو خطأ.",
      );
    }
    return;
  }

  if (type === "link") {
    if (!trim(row.data) && !correct) {
      pushError(
        errors,
        rowNumber,
        row,
        "المعطيات",
        "نوع «الرابط العجيب» يحتاج كلمات الرابط في عمود المعطيات (مثل: موسى | العصا | البحر).",
      );
    }
    if (!correct) {
      pushError(errors, rowNumber, row, "الإجابة الصحيحة", "الإجابة الصحيحة مطلوبة.");
    }
    return;
  }

  if (type === "who_am_i") {
    if (!trim(row.data) && !trim(row.clue)) {
      pushError(
        errors,
        rowNumber,
        row,
        "المعطيات",
        "نوع «من أنا» يحتاج التلميح/الوصف في عمود المعطيات.",
      );
    }
    if (!correct) {
      pushError(errors, rowNumber, row, "الإجابة الصحيحة", "الإجابة الصحيحة مطلوبة.");
    }
    return;
  }

  if (type === "image") {
    if (!imageUrl) {
      pushError(
        errors,
        rowNumber,
        row,
        "رابط الصورة",
        "نوع «صورة» يحتاج رابط الصورة في العمود المخصص.",
      );
    }
    if (!correct) {
      pushError(errors, rowNumber, row, "الإجابة الصحيحة", "الإجابة الصحيحة مطلوبة.");
    }
  }
}

/** Validate every row in the workbook and produce a structured Arabic report. */
export function validateQuestionBankRows(
  rows: Record<string, unknown>[],
  headerRowIndex = 3,
): WorkbookValidationReport {
  const errors: WorkbookValidationError[] = [];
  const warnings: WorkbookValidationWarning[] = [];
  const previewCandidates: WorkbookPreviewSample[] = [];
  const stageCounts: Record<AdminStageKey, number> = {
    stage1: 0,
    stage2: 0,
    stage3: 0,
    stage4: 0,
  };
  const typeCounts: Record<AdminStageKey, Record<string, number>> = {
    stage1: {},
    stage2: {},
    stage3: {},
    stage4: {},
  };
  const seenIds = new Map<string, number>();
  let validCount = 0;

  rows.forEach((row, index) => {
    if (isRowEmpty(row)) {
      return;
    }

    const rowNumber = headerRowIndex + 1 + index;
    const id = trim(row.id);
    const stageRaw = trim(row.stage).toLowerCase();
    const stage = (
      stageRaw === "stage1" || stageRaw === "stage2" || stageRaw === "stage3" || stageRaw === "stage4"
        ? stageRaw
        : null
    ) as AdminStageKey | null;

    if (!stage) {
      pushError(errors, rowNumber, row, "المرحلة", "المرحلة غير صالحة — استخدم stage1 أو stage2 أو stage3 أو stage4.");
      return;
    }

    if (!id) {
      pushError(errors, rowNumber, row, "رقم السؤال", "معرّف السؤال (id) مطلوب.");
      return;
    }

    if (seenIds.has(id)) {
      pushError(
        errors,
        rowNumber,
        row,
        "رقم السؤال",
        `المعرّف «${id}» مكرر — أول ظهور في الصف ${seenIds.get(id)}.`,
      );
      return;
    }
    seenIds.set(id, rowNumber);

    const rawType = row.type ?? row.typename;
    const type = resolveTypeForStage(stage, rawType);
    if (!type) {
      const allowed = getAllowedArabicTypesForStage(stage).join(" · ");
      // عند نقل سؤال بين المراحل: نوضّح أن النوع نفسه يجب أن يتغيّر، ونسرد المسموح (#6).
      const movedFromElsewhere =
        normalizeStage1ExcelType(rawType) ||
        normalizeStage2ExcelType(rawType) ||
        normalizeStage3ExcelType(rawType) ||
        normalizeStage4ExcelType(rawType);
      const hint = movedFromElsewhere
        ? ` — نوع «${trim(rawType)}» يخص مرحلة أخرى. عند نقل السؤال إلى ${getStageDisplayLabel(stage)} غيّر عمود «النوع» إلى أحد: ${allowed}`
        : ` — الأنواع المسموحة في ${getStageDisplayLabel(stage)}: ${allowed}`;
      pushError(
        errors,
        rowNumber,
        row,
        "نوع السؤال",
        `نوع «${trim(rawType)}» غير مدعوم في ${getStageDisplayLabel(stage)}${hint}`,
      );
      return;
    }

    if (stage === "stage3") {
      const field = normalizeStage3Field(row.category);
      const level = normalizeStage3Level(row.level);
      if (!field) {
        pushError(
          errors,
          rowNumber,
          row,
          "المجال",
          "المرحلة الثالثة تحتاج مجالاً صالحاً (شخصيات، معجزات، أمثال، زمان ومكان، أعداد).",
        );
      }
      if (!level) {
        pushError(
          errors,
          rowNumber,
          row,
          "المستوى",
          "المرحلة الثالثة تحتاج مستوى صالحاً (سهل، متوسط، صعب).",
        );
      }
    }

    validateTypeRequirements(errors, rowNumber, row, type);

    // المرحلة 2 — ترتيب الآية: لا يُعرض أكثر من 5 أجزاء سويّاً، فإن زادت قسّم الآية
    // إلى سؤالين أو أكثر (كل منهما ≤5 أجزاء).
    if (stage === "stage2" && type === "arrangeVerse") {
      const fragments = splitPipeList(row.data);
      if (fragments.length > 5) {
        pushError(
          errors,
          rowNumber,
          row,
          "المعطيات",
          `«رتّب الآية» يحتوي ${fragments.length} أجزاء — الحد الأقصى 5 أجزاء لكل سؤال. قسّمها إلى أسئلة أصغر.`,
        );
      }
    }

    const hadRowErrors = errors.some((error) => error.row === rowNumber);
    if (!hadRowErrors) {
      collectTypeWarnings(warnings, rowNumber, row, type);
      validCount += 1;
      stageCounts[stage] += 1;
      const typeLabel = getArabicLabelForExcelType(type);
      typeCounts[stage][typeLabel] = (typeCounts[stage][typeLabel] ?? 0) + 1;

      const prompt = trim(row.question) || trim(row.prompt);
      previewCandidates.push({
        stage,
        stageLabel: getStageDisplayLabel(stage),
        id: trim(row.id),
        typeLabel,
        promptPreview: prompt.length > 72 ? `${prompt.slice(0, 72)}…` : prompt,
        hasImage: Boolean(trim(row.imageurl) || trim(row.image)),
      });
    }
  });

  const previewByStage = new Map<string, WorkbookPreviewSample>();
  previewCandidates.forEach((sample) => {
    if (!previewByStage.has(sample.stage)) {
      previewByStage.set(sample.stage, sample);
    }
  });
  const previewSamples = [...previewByStage.values()];

  const stages: StageValidationSummary[] = (["stage1", "stage2", "stage3", "stage4"] as const).map(
    (stage) => ({
      stage,
      stageLabel: getStageDisplayLabel(stage),
      totalQuestions: stageCounts[stage],
      types: Object.entries(typeCounts[stage])
        .map(([typeLabel, count]) => ({ typeLabel, count }))
        .sort((a, b) => b.count - a.count),
    }),
  );

  return {
    valid: errors.length === 0 && validCount > 0,
    totalRows: rows.filter((row) => !isRowEmpty(row)).length,
    totalValidQuestions: validCount,
    errors,
    warnings,
    previewSamples,
    stages,
  };
}
