import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { firestore } from "@/firebase/firebaseClient";
import { MAIN_COMPETITION_ID } from "@/firebase/firestore";
import {
  DEFAULT_BANK_SIZES,
  type QuestionDisplaySettings,
} from "@/features/facilitator/question-display-settings";
import type { AdminStageKey } from "@/features/facilitator/facilitator-team-admin";

export interface QuestionBankMeta {
  bankSizes: Record<AdminStageKey, number>;
  stage2ReadingReference: string;
  stage2ReadingPassage: string;
  updatedAt?: unknown;
}

function metaDocRef() {
  return doc(firestore, "competitions", MAIN_COMPETITION_ID, "questionBanks", "meta");
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
  };
}
