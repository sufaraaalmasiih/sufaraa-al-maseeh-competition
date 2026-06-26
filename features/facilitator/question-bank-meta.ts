import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { getClientFirestore } from "@/firebase/firebaseClient";
import { MAIN_COMPETITION_ID } from "@/firebase/firestore";
import {
  DEFAULT_BANK_SIZES,
  type QuestionDisplaySettings,
  type Stage2FieldDisplaySettings,
} from "@/features/facilitator/question-display-settings";
import type { AdminStageKey } from "@/features/facilitator/facilitator-team-admin";

export interface QuestionBankMeta {
  bankSizes: Record<AdminStageKey, number>;
  stage2ReadingReference: string;
  stage2ReadingPassage: string;
  updatedAt?: unknown;
}

export interface CurrentQuestionBankMeta extends QuestionBankMeta {
  stage2FieldSizes: Stage2FieldDisplaySettings;
  stage2MatchingPairCount: number;
}

function metaDocRef() {
  return doc(getClientFirestore(), "competitions", MAIN_COMPETITION_ID, "questionBanks", "meta");
}

function stageDocRef(stage: AdminStageKey) {
  return doc(getClientFirestore(), "competitions", MAIN_COMPETITION_ID, "questionBanks", stage);
}

const DEFAULT_META: QuestionBankMeta = {
  bankSizes: { ...DEFAULT_BANK_SIZES },
  stage2ReadingReference: "يوحنا 15: 1-17",
  stage2ReadingPassage: "",
};

function parseBankSizes(raw: unknown): Record<AdminStageKey, number> {
  const sizes = { ...DEFAULT_BANK_SIZES };
  if (!raw || typeof raw !== "object") {
    return sizes;
  }

  const record = raw as Record<string, unknown>;
  (Object.keys(sizes) as AdminStageKey[]).forEach((key) => {
    const value = record[key];
    if (typeof value === "number" && Number.isFinite(value) && value > 0) {
      sizes[key] = Math.floor(value);
    }
  });

  return sizes;
}

export function parseQuestionBankMeta(data: Record<string, unknown> | undefined): QuestionBankMeta {
  if (!data) {
    return { ...DEFAULT_META };
  }

  return {
    bankSizes: parseBankSizes(data.bankSizes),
    stage2ReadingReference:
      typeof data.stage2ReadingReference === "string" && data.stage2ReadingReference.trim()
        ? data.stage2ReadingReference.trim()
        : DEFAULT_META.stage2ReadingReference,
    stage2ReadingPassage:
      typeof data.stage2ReadingPassage === "string" ? data.stage2ReadingPassage.trim() : "",
    updatedAt: data.updatedAt,
  };
}

export async function fetchQuestionBankMeta(): Promise<QuestionBankMeta> {
  const snapshot = await getDoc(metaDocRef());
  return parseQuestionBankMeta(snapshot.data());
}

function arraySize(value: unknown): number {
  return Array.isArray(value) ? value.length : 0;
}

function objectSize(value: unknown): number {
  return value && typeof value === "object" ? Object.keys(value).length : 0;
}

function countMatchingPairs(value: unknown): number {
  if (!Array.isArray(value)) {
    return 0;
  }

  return value.reduce((total, question) => {
    if (!question || typeof question !== "object") {
      return total;
    }
    const pairs = (question as Record<string, unknown>).pairs;
    return total + arraySize(pairs);
  }, 0);
}

export function deriveCurrentBankSizes(input: {
  stage1Questions?: unknown;
  stage2Data?: Record<string, unknown>;
  stage3Questions?: unknown;
  stage4Questions?: unknown;
}): {
  bankSizes: Record<AdminStageKey, number>;
  stage2FieldSizes: Stage2FieldDisplaySettings;
  stage2MatchingPairCount: number;
} {
  const stage2Data = input.stage2Data ?? {};
  const stage2MatchingPairCount = countMatchingPairs(stage2Data.matching);
  const stage2FieldSizes: Stage2FieldDisplaySettings = {
    matching: arraySize(stage2Data.matching),
    arrangeVerse: arraySize(stage2Data.arrangeVerse),
    completeVerse: arraySize(stage2Data.completeVerse),
    trueFalseCorrect: arraySize(stage2Data.trueFalseCorrect),
  };

  return {
    bankSizes: {
      stage1: arraySize(input.stage1Questions),
      stage2:
        stage2MatchingPairCount +
        stage2FieldSizes.arrangeVerse +
        stage2FieldSizes.completeVerse +
        stage2FieldSizes.trueFalseCorrect,
      stage3: objectSize(input.stage3Questions),
      stage4: arraySize(input.stage4Questions),
    },
    stage2FieldSizes,
    stage2MatchingPairCount,
  };
}

export async function fetchCurrentQuestionBankMeta(): Promise<CurrentQuestionBankMeta> {
  const [stage1Snapshot, stage2Snapshot, stage3Snapshot, stage4Snapshot, metaSnapshot] =
    await Promise.all([
      getDoc(stageDocRef("stage1")),
      getDoc(stageDocRef("stage2")),
      getDoc(stageDocRef("stage3")),
      getDoc(stageDocRef("stage4")),
      getDoc(metaDocRef()),
    ]);

  const meta = parseQuestionBankMeta(metaSnapshot.data());
  const current = deriveCurrentBankSizes({
    stage1Questions: stage1Snapshot.data()?.questions,
    stage2Data: stage2Snapshot.data(),
    stage3Questions: stage3Snapshot.data()?.questions,
    stage4Questions: stage4Snapshot.data()?.questions,
  });

  return {
    ...meta,
    bankSizes: current.bankSizes,
    stage2FieldSizes: current.stage2FieldSizes,
    stage2MatchingPairCount: current.stage2MatchingPairCount,
  };
}

export async function saveQuestionBankMeta(patch: Partial<QuestionBankMeta>): Promise<void> {
  const current = await fetchQuestionBankMeta();
  await setDoc(
    metaDocRef(),
    {
      bankSizes: patch.bankSizes ?? current.bankSizes,
      stage2ReadingReference: patch.stage2ReadingReference ?? current.stage2ReadingReference,
      stage2ReadingPassage: patch.stage2ReadingPassage ?? current.stage2ReadingPassage,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export interface WorkbookBankStats {
  bankSizes: Record<AdminStageKey, number>;
  stage2ReadingReference: string;
  stage2ReadingPassage: string;
}

function trim(value: unknown): string {
  return typeof value === "string" ? value.trim() : value == null ? "" : String(value).trim();
}

/** Count rows per stage from unified All_Questions rows and detect Stage2 reading reference. */
export function deriveWorkbookBankStats(rows: Record<string, unknown>[]): WorkbookBankStats {
  const bankSizes: Record<AdminStageKey, number> = { ...DEFAULT_BANK_SIZES };
  const stageCounts: Record<AdminStageKey, number> = {
    stage1: 0,
    stage2: 0,
    stage3: 0,
    stage4: 0,
  };

  let stage2ReadingReference = "";

  rows.forEach((row) => {
    const stage = trim(row.stage).toLowerCase();
    if (stage === "stage1") {
      stageCounts.stage1 += 1;
    } else if (stage === "stage2") {
      stageCounts.stage2 += 1;
      if (!stage2ReadingReference) {
        const notes = trim(row.notes);
        const targetPart = trim(row.targetpart);
        const category = trim(row.category);
        stage2ReadingReference = notes || targetPart || category;
      }
    } else if (stage === "stage3") {
      stageCounts.stage3 += 1;
    } else if (stage === "stage4") {
      stageCounts.stage4 += 1;
    }
  });

  (Object.keys(stageCounts) as AdminStageKey[]).forEach((key) => {
    if (stageCounts[key] > 0) {
      bankSizes[key] = stageCounts[key];
    }
  });

  return {
    bankSizes,
    stage2ReadingReference: stage2ReadingReference || DEFAULT_META.stage2ReadingReference,
    stage2ReadingPassage: "",
  };
}

export function clampSettingsToBankSizes(
  settings: QuestionDisplaySettings,
  bankSizes: Record<AdminStageKey, number>,
  stage2FieldSizes?: Stage2FieldDisplaySettings,
): QuestionDisplaySettings {
  return {
    stage1: {
      ...settings.stage1,
      displayCount: Math.min(settings.stage1.displayCount, bankSizes.stage1),
    },
    stage2: {
      ...settings.stage2,
      displayCount: Math.min(settings.stage2.displayCount, bankSizes.stage2),
    },
    stage3: {
      ...settings.stage3,
      displayCount: Math.min(settings.stage3.displayCount, bankSizes.stage3),
    },
    stage4: {
      ...settings.stage4,
      displayCount: Math.min(settings.stage4.displayCount, bankSizes.stage4),
    },
    stage2Fields: stage2FieldSizes
      ? {
          matching: Math.min(settings.stage2Fields.matching, stage2FieldSizes.matching),
          arrangeVerse: Math.min(
            settings.stage2Fields.arrangeVerse,
            stage2FieldSizes.arrangeVerse,
          ),
          completeVerse: Math.min(
            settings.stage2Fields.completeVerse,
            stage2FieldSizes.completeVerse,
          ),
          trueFalseCorrect: Math.min(
            settings.stage2Fields.trueFalseCorrect,
            stage2FieldSizes.trueFalseCorrect,
          ),
        }
      : settings.stage2Fields,
  };
}
