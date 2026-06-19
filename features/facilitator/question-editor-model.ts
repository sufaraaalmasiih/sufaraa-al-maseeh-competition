import type { AdminStageKey } from "@/features/facilitator/facilitator-team-admin";
import type { FullQuestionBankPayload } from "@/features/facilitator/question-bank-types";
import {
  parseWorkbookRowsToBank,
} from "@/features/facilitator/question-bank-workbook-parser";
import {
  validateQuestionBankRows,
  type WorkbookValidationError,
} from "@/features/facilitator/question-bank-workbook-validation";
import {
  STAGE1_EXCEL_TYPES,
  STAGE2_EXCEL_TYPES,
  STAGE3_FIELD_KEYS,
  STAGE3_FIELD_LABELS,
  STAGE3_LEVELS,
  STAGE3_LEVEL_LABELS,
  STAGE3_TYPE_LABELS,
  ALL_GAME_QUESTION_TYPES,
  type AllGameQuestionType,
} from "@/features/facilitator/question-type-registry";

/**
 * نموذج محرّر الأسئلة داخل التطبيق. يعمل في «فضاء الصفوف» نفسه الذي يستخدمه
 * استيراد Excel، فيُعاد استخدام نفس المُحلِّل والمُدقِّق المثبَّتين باختبارات.
 * كل عنصر = سؤال منطقي واحد (التوصيل = عنصر واحد بعدة أزواج).
 */

export interface EditorPair {
  left: string;
  correctRight: string;
}

export interface EditorItem {
  uid: string;
  stage: AdminStageKey;
  type: string;
  id: string;
  question: string;
  correct: string;
  reference: string;
  imageUrl: string;
  options: string[];
  parts: string[];
  pairs: EditorPair[];
  data: string;
  category: string;
  level: string;
  correctIsTrue: boolean;
  /** إجابات بديلة مقبولة (المرحلة 4) — مفصولة في صف Excel بـ |. */
  acceptedAnswers: string[];
}

export const STAGE_LABELS: Record<AdminStageKey, string> = {
  stage1: "المرحلة 1 — اجمعوا الكنوز",
  stage2: "المرحلة 2 — فتّشوا الكتب",
  stage3: "المرحلة 3 — على المحك",
  stage4: "المرحلة 4 — اثبتوا بالحق",
};

export function getTypeLabel(type: string): string {
  return STAGE3_TYPE_LABELS[type as AllGameQuestionType] ?? type;
}

/** الأنواع المسموحة لكل مرحلة (قيمة + تسمية عربية). */
export function typesForStage(stage: AdminStageKey): { value: string; label: string }[] {
  const list =
    stage === "stage1"
      ? STAGE1_EXCEL_TYPES
      : stage === "stage2"
        ? STAGE2_EXCEL_TYPES
        : ALL_GAME_QUESTION_TYPES;
  return list.map((value) => ({ value, label: getTypeLabel(value) }));
}

export const STAGE3_FIELD_OPTIONS = STAGE3_FIELD_KEYS.map((value) => ({
  value,
  label: STAGE3_FIELD_LABELS[value],
}));

export const STAGE3_LEVEL_OPTIONS = STAGE3_LEVELS.map((value) => ({
  value,
  label: STAGE3_LEVEL_LABELS[value],
}));

/** الحقول التي يعرضها النموذج حسب النوع. */
export interface TypeFieldConfig {
  needsQuestion: boolean;
  questionLabel: string;
  needsOptions: boolean;
  needsParts: boolean;
  partsLabel: string;
  needsPairs: boolean;
  needsCorrect: boolean;
  correctLabel: string;
  needsData: boolean;
  dataLabel: string;
  needsImage: boolean;
  isTrueFalse: boolean;
}

const DEFAULT_FIELD_CONFIG: TypeFieldConfig = {
  needsQuestion: true,
  questionLabel: "نص السؤال",
  needsOptions: false,
  needsParts: false,
  partsLabel: "الأجزاء (بالترتيب الصحيح)",
  needsPairs: false,
  needsCorrect: true,
  correctLabel: "الإجابة الصحيحة",
  needsData: false,
  dataLabel: "المعطيات",
  needsImage: false,
  isTrueFalse: false,
};

export function fieldsForType(type: string): TypeFieldConfig {
  switch (type) {
    case "multiple_choice":
      return { ...DEFAULT_FIELD_CONFIG, needsOptions: true, correctLabel: "الإجابة الصحيحة (من الخيارات)" };
    case "arrange":
      return { ...DEFAULT_FIELD_CONFIG, needsParts: true, needsCorrect: false };
    case "arrangeVerse":
      return {
        ...DEFAULT_FIELD_CONFIG,
        needsParts: true,
        partsLabel: "أجزاء الآية (بالترتيب الصحيح)",
        needsCorrect: false,
      };
    case "completeVerse":
      return {
        ...DEFAULT_FIELD_CONFIG,
        needsData: true,
        dataLabel: "الآية مع فراغ (استخدم ___ مكان الناقص)",
        correctLabel: "الكلمة/الكلمات الناقصة",
      };
    case "matching":
      return { ...DEFAULT_FIELD_CONFIG, needsQuestion: false, needsCorrect: false, needsPairs: true };
    case "trueFalseCorrect":
      return {
        ...DEFAULT_FIELD_CONFIG,
        questionLabel: "الجملة (صحيحة أو بها خطأ)",
        needsCorrect: false,
        isTrueFalse: true,
        needsData: true,
        dataLabel: "التصحيح (إن كانت خطأ)",
      };
    case "link":
      return { ...DEFAULT_FIELD_CONFIG, needsData: true, dataLabel: "كلمات الرابط (مثل: موسى | العصا | البحر)" };
    case "who_am_i":
      return { ...DEFAULT_FIELD_CONFIG, needsData: true, dataLabel: "التلميح/الوصف" };
    case "image":
      return { ...DEFAULT_FIELD_CONFIG, needsImage: true };
    case "missing":
    case "fill_blank":
    default:
      return { ...DEFAULT_FIELD_CONFIG };
  }
}

let uidCounter = 0;
function nextUid(): string {
  uidCounter += 1;
  return `item-${uidCounter}`;
}

export function blankItem(stage: AdminStageKey): EditorItem {
  const type = typesForStage(stage)[0]?.value ?? "missing";
  return {
    uid: nextUid(),
    stage,
    type,
    id: "",
    question: "",
    correct: "",
    reference: "",
    imageUrl: "",
    options: ["", ""],
    parts: ["", ""],
    pairs: [
      { left: "", correctRight: "" },
      { left: "", correctRight: "" },
    ],
    data: "",
    category: stage === "stage3" ? STAGE3_FIELD_KEYS[0] : "",
    level: stage === "stage3" ? STAGE3_LEVELS[0] : "",
    correctIsTrue: true,
    acceptedAnswers: [],
  };
}

function joinPipe(values: string[]): string {
  return values.map((value) => value.trim()).filter(Boolean).join(" | ");
}

/** يحوّل عنصر المحرّر إلى صف/صفوف Excel موحّدة (التوصيل = عدة صفوف). */
export function editorItemToRows(item: EditorItem): Record<string, string>[] {
  const base: Record<string, string> = {
    id: item.id.trim(),
    stage: item.stage,
    type: item.type,
    reference: item.reference.trim(),
    imageurl: item.imageUrl.trim(),
  };
  const accepted = joinPipe(item.acceptedAnswers);
  if (accepted) {
    base.acceptedanswers = accepted;
  }
  if (item.stage === "stage3") {
    base.category = item.category;
    base.level = item.level;
  }

  const config = fieldsForType(item.type);

  if (config.needsPairs) {
    return item.pairs
      .filter((pair) => pair.left.trim() || pair.correctRight.trim())
      .map((pair, index) => ({
        ...base,
        id: `${base.id}-${index + 1}`,
        question: pair.left.trim(),
        correct: pair.correctRight.trim(),
      }));
  }

  const row: Record<string, string> = { ...base, question: item.question.trim() };

  if (config.needsOptions) {
    item.options.slice(0, 4).forEach((option, index) => {
      row[`option${index + 1}`] = option.trim();
    });
  }

  if (config.needsParts) {
    row.data = joinPipe(item.parts);
    row.correct = joinPipe(item.parts);
  } else if (config.isTrueFalse) {
    row.correct = item.correctIsTrue ? "صح" : "خطأ";
    row.data = item.data.trim();
  } else {
    if (config.needsData) {
      row.data = item.data.trim();
    }
    if (config.needsCorrect || config.needsData) {
      row.correct = item.correct.trim();
    }
  }

  return [row];
}

/** كل عناصر مرحلة → صفوف موحّدة. */
export function itemsToRows(items: EditorItem[]): Record<string, string>[] {
  return items.flatMap((item) => editorItemToRows(item));
}

/** يبني حمولة بنك كاملة من قائمة العناصر (كل المراحل). */
export function itemsToPayload(items: EditorItem[]): FullQuestionBankPayload {
  return parseWorkbookRowsToBank(itemsToRows(items));
}

/** أخطاء التحقق لعنصر واحد (يُعاد استخدام مُدقِّق Excel نفسه). */
export function validateItem(item: EditorItem): WorkbookValidationError[] {
  return validateQuestionBankRows(editorItemToRows(item)).errors;
}

function arr(value: unknown): string[] {
  return Array.isArray(value) ? value.map((entry) => String(entry ?? "")) : [];
}

/** يبني عناصر المحرّر من البنك المخزَّن (كل المراحل). */
export function payloadToEditorItems(payload: FullQuestionBankPayload): EditorItem[] {
  const items: EditorItem[] = [];

  payload.stage1.forEach((question) => {
    const q = question as unknown as Record<string, unknown>;
    const parts = arr(q.correctOrder).length > 0 ? arr(q.correctOrder) : arr(q.parts);
    items.push({
      ...blankItem("stage1"),
      uid: nextUid(),
      type: String(q.type ?? "missing"),
      id: String(q.id ?? ""),
      question: String(q.prompt ?? ""),
      correct: String(q.correctAnswer ?? ""),
      reference: String(q.reference ?? ""),
      imageUrl: String(q.imageUrl ?? ""),
      options: arr(q.options).length > 0 ? arr(q.options) : ["", ""],
      parts: parts.length > 0 ? parts : ["", ""],
    });
  });

  payload.stage2.matching.forEach((question) => {
    const q = question as unknown as Record<string, unknown>;
    const pairs = Array.isArray(q.pairs)
      ? (q.pairs as Record<string, unknown>[]).map((pair) => ({
          left: String(pair.left ?? ""),
          correctRight: String(pair.correctRight ?? ""),
        }))
      : [];
    items.push({
      ...blankItem("stage2"),
      uid: nextUid(),
      type: "matching",
      id: String(q.id ?? ""),
      reference: String(q.reference ?? ""),
      imageUrl: String(q.imageUrl ?? ""),
      pairs: pairs.length > 0 ? pairs : [{ left: "", correctRight: "" }],
    });
  });

  payload.stage2.arrangeVerse.forEach((question) => {
    const q = question as unknown as Record<string, unknown>;
    const parts = arr(q.correctOrder).length > 0 ? arr(q.correctOrder) : arr(q.fragments);
    items.push({
      ...blankItem("stage2"),
      uid: nextUid(),
      type: "arrangeVerse",
      id: String(q.id ?? ""),
      question: String(q.prompt ?? ""),
      reference: String(q.reference ?? ""),
      imageUrl: String(q.imageUrl ?? ""),
      parts: parts.length > 0 ? parts : ["", ""],
    });
  });

  payload.stage2.completeVerse.forEach((question) => {
    const q = question as unknown as Record<string, unknown>;
    items.push({
      ...blankItem("stage2"),
      uid: nextUid(),
      type: "completeVerse",
      id: String(q.id ?? ""),
      question: String(q.prompt ?? ""),
      data: String(q.verseWithBlank ?? ""),
      correct: String(q.correctAnswer ?? ""),
      reference: String(q.reference ?? ""),
      imageUrl: String(q.imageUrl ?? ""),
    });
  });

  payload.stage2.trueFalseCorrect.forEach((question) => {
    const q = question as unknown as Record<string, unknown>;
    items.push({
      ...blankItem("stage2"),
      uid: nextUid(),
      type: "trueFalseCorrect",
      id: String(q.id ?? ""),
      question: String(q.statement ?? ""),
      correctIsTrue: q.correctIsTrue === true,
      data: String(q.expectedCorrection ?? ""),
      reference: String(q.reference ?? ""),
      imageUrl: String(q.imageUrl ?? ""),
    });
  });

  Object.values(payload.stage3).forEach((question) => {
    const q = question as unknown as Record<string, unknown>;
    const parts = arr(q.correctOrder).length > 0 ? arr(q.correctOrder) : arr(q.parts);
    items.push({
      ...blankItem("stage3"),
      uid: nextUid(),
      type: String(q.type ?? "missing"),
      id: String(q.id ?? ""),
      question: String(q.prompt ?? ""),
      correct: String(q.correctAnswer ?? ""),
      reference: String(q.reference ?? ""),
      imageUrl: String(q.imageUrl ?? ""),
      options: arr(q.options).length > 0 ? arr(q.options) : ["", ""],
      parts: parts.length > 0 ? parts : ["", ""],
      category: String(q.fieldId ?? STAGE3_FIELD_KEYS[0]),
      level: String(q.difficulty ?? STAGE3_LEVELS[0]),
    });
  });

  payload.stage4.forEach((question) => {
    const q = question as unknown as Record<string, unknown>;
    const type = String(q.type ?? "missing");
    const data =
      type === "link"
        ? String(q.linkText ?? "")
        : type === "who_am_i"
          ? String(q.clue ?? "")
          : "";
    const parts = arr(q.correctOrder).length > 0 ? arr(q.correctOrder) : arr(q.parts);
    items.push({
      ...blankItem("stage4"),
      uid: nextUid(),
      type,
      id: String(q.id ?? ""),
      question: String(q.prompt ?? ""),
      correct: String(q.correctAnswer ?? ""),
      reference: String(q.reference ?? ""),
      imageUrl: String(q.imageUrl ?? ""),
      options: arr(q.options).length > 0 ? arr(q.options) : ["", ""],
      parts: parts.length > 0 ? parts : ["", ""],
      data,
      acceptedAnswers: arr(q.acceptedAnswers),
    });
  });

  return items;
}
