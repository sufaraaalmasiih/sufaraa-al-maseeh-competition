import { serverTimestamp, updateDoc } from "firebase/firestore";
import { gameFlowRef } from "@/firebase/firestore";
import { assertCompetitionSettingsEditable } from "@/features/facilitator/question-bank-lock";
import { seededShuffleStage1Parts } from "@/features/stage1/stage1-arrange";
import { STAGE_OPTIONS_LABELS } from "@/features/facilitator/facilitator-controls-copy";
import type { AdminStageKey } from "@/features/facilitator/facilitator-team-admin";

export type QuestionOrderMode = "order" | "random";

export interface StageQuestionDisplaySettings {
  /** How many questions from this stage's bank appear in the run. */
  displayCount: number;
  /** Bank order (as written in Excel) or deterministic random shuffle. */
  orderMode: QuestionOrderMode;
}

/** عدد الأسئلة الظاهرة لكل حقل من حقول المرحلة الثانية الأربعة. */
export interface Stage2FieldDisplaySettings {
  matching: number;
  arrangeVerse: number;
  completeVerse: number;
  trueFalseCorrect: number;
}

export interface QuestionDisplaySettings {
  stage1: StageQuestionDisplaySettings;
  stage2: StageQuestionDisplaySettings;
  stage3: StageQuestionDisplaySettings;
  stage4: StageQuestionDisplaySettings;
  /** تحكم منفصل بعدد أسئلة كل مجال في المرحلة الثانية (#5). */
  stage2Fields: Stage2FieldDisplaySettings;
}

export const DEFAULT_STAGE2_FIELD_DISPLAY: Stage2FieldDisplaySettings = {
  matching: 5,
  arrangeVerse: 5,
  completeVerse: 5,
  trueFalseCorrect: 5,
};

export const STAGE2_FIELD_KEYS: (keyof Stage2FieldDisplaySettings)[] = [
  "matching",
  "arrangeVerse",
  "completeVerse",
  "trueFalseCorrect",
];

export const STAGE2_FIELD_LABELS: Record<keyof Stage2FieldDisplaySettings, string> = {
  matching: "التوصيل",
  arrangeVerse: "ترتيب الآية",
  completeVerse: "إكمال الآية",
  trueFalseCorrect: "صح أو خطأ",
};

export const STAGE_DISPLAY_KEYS: AdminStageKey[] = ["stage1", "stage2", "stage3", "stage4"];

export const DEFAULT_QUESTION_DISPLAY_SETTINGS: QuestionDisplaySettings = {
  stage1: { displayCount: 50, orderMode: "random" },
  stage2: { displayCount: 40, orderMode: "order" },
  stage3: { displayCount: 30, orderMode: "order" },
  stage4: { displayCount: 15, orderMode: "random" },
  stage2Fields: { ...DEFAULT_STAGE2_FIELD_DISPLAY },
};

function clampFieldCount(value: unknown, fallback: number): number {
  const parsed =
    typeof value === "number" && Number.isFinite(value) ? Math.floor(value) : fallback;
  return Math.max(0, Math.min(50, parsed));
}

export function parseStage2FieldSettings(raw: unknown): Stage2FieldDisplaySettings {
  const record = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  return {
    matching: clampFieldCount(record.matching, DEFAULT_STAGE2_FIELD_DISPLAY.matching),
    arrangeVerse: clampFieldCount(record.arrangeVerse, DEFAULT_STAGE2_FIELD_DISPLAY.arrangeVerse),
    completeVerse: clampFieldCount(record.completeVerse, DEFAULT_STAGE2_FIELD_DISPLAY.completeVerse),
    trueFalseCorrect: clampFieldCount(
      record.trueFalseCorrect,
      DEFAULT_STAGE2_FIELD_DISPLAY.trueFalseCorrect,
    ),
  };
}

export const DEFAULT_BANK_SIZES: Record<AdminStageKey, number> = {
  stage1: 50,
  stage2: 40,
  stage3: 30,
  stage4: 15,
};

export function getStageDisplayLabel(stage: AdminStageKey): string {
  return STAGE_OPTIONS_LABELS[stage];
}

function clampDisplayCount(value: unknown, fallback: number, bankSize: number): number {
  const parsed = typeof value === "number" && Number.isFinite(value) ? Math.floor(value) : fallback;
  const safeBank = Math.max(0, Math.floor(bankSize));
  if (safeBank === 0) {
    return 0;
  }
  return Math.max(1, Math.min(safeBank, parsed));
}

function parseOrderMode(value: unknown): QuestionOrderMode {
  return value === "random" ? "random" : "order";
}

function parseStageSettings(
  raw: unknown,
  fallback: StageQuestionDisplaySettings,
  bankSize: number,
): StageQuestionDisplaySettings {
  if (!raw || typeof raw !== "object") {
    return {
      displayCount: clampDisplayCount(fallback.displayCount, fallback.displayCount, bankSize),
      orderMode: fallback.orderMode,
    };
  }

  const record = raw as Record<string, unknown>;
  return {
    displayCount: clampDisplayCount(record.displayCount, fallback.displayCount, bankSize),
    orderMode: parseOrderMode(record.orderMode),
  };
}

export function parseQuestionDisplaySettings(
  data: Record<string, unknown> | undefined,
  bankSizes: Partial<Record<AdminStageKey, number>> = {},
): QuestionDisplaySettings {
  const nested = data?.questionDisplaySettings;
  const legacyStage4 =
    typeof data?.stage4QuestionCount === "number" && Number.isFinite(data.stage4QuestionCount)
      ? Math.floor(data.stage4QuestionCount)
      : DEFAULT_QUESTION_DISPLAY_SETTINGS.stage4.displayCount;

  const sizes: Record<AdminStageKey, number> = { ...DEFAULT_BANK_SIZES, ...bankSizes };

  if (nested && typeof nested === "object") {
    const record = nested as Record<string, unknown>;
    return {
      stage1: parseStageSettings(record.stage1, DEFAULT_QUESTION_DISPLAY_SETTINGS.stage1, sizes.stage1),
      stage2: parseStageSettings(record.stage2, DEFAULT_QUESTION_DISPLAY_SETTINGS.stage2, sizes.stage2),
      stage3: parseStageSettings(record.stage3, DEFAULT_QUESTION_DISPLAY_SETTINGS.stage3, sizes.stage3),
      stage4: parseStageSettings(
        record.stage4,
        { ...DEFAULT_QUESTION_DISPLAY_SETTINGS.stage4, displayCount: legacyStage4 },
        sizes.stage4,
      ),
      stage2Fields: parseStage2FieldSettings(record.stage2Fields),
    };
  }

  return {
    stage1: parseStageSettings(undefined, DEFAULT_QUESTION_DISPLAY_SETTINGS.stage1, sizes.stage1),
    stage2: parseStageSettings(undefined, DEFAULT_QUESTION_DISPLAY_SETTINGS.stage2, sizes.stage2),
    stage3: parseStageSettings(undefined, DEFAULT_QUESTION_DISPLAY_SETTINGS.stage3, sizes.stage3),
    stage4: {
      displayCount: clampDisplayCount(legacyStage4, DEFAULT_QUESTION_DISPLAY_SETTINGS.stage4.displayCount, sizes.stage4),
      orderMode: "order",
    },
    stage2Fields: parseStage2FieldSettings(undefined),
  };
}

export async function writeQuestionDisplaySettings(settings: QuestionDisplaySettings): Promise<void> {
  await assertCompetitionSettingsEditable();
  await updateDoc(gameFlowRef, {
    questionDisplaySettings: settings,
    stage4QuestionCount: settings.stage4.displayCount,
    updatedAt: serverTimestamp(),
  });
}

/** Build bank indices for one stage run (0-based positions into the stage bank). */
export function buildActiveQuestionIndices(
  bankLength: number,
  displayCount: number,
  orderMode: QuestionOrderMode,
  seed: string,
): number[] {
  const safeBankLength = Math.max(0, bankLength);
  if (safeBankLength === 0) {
    return [];
  }

  const count = Math.max(1, Math.min(safeBankLength, Math.floor(displayCount)));
  const indices = Array.from({ length: safeBankLength }, (_, index) => index);

  if (orderMode === "random") {
    return seededShuffleStage1Parts(indices, seed).slice(0, count);
  }

  return indices.slice(0, count);
}

export function parseActiveQuestionIndices(value: unknown): number[] | null {
  if (!Array.isArray(value)) {
    return null;
  }

  const indices = value.filter((entry): entry is number => typeof entry === "number" && Number.isFinite(entry));
  return indices.length > 0 ? indices.map((entry) => Math.floor(entry)) : null;
}
