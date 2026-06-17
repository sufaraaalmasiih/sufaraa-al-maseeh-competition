import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { getClientFirestore } from "@/firebase/firebaseClient";
import { MAIN_COMPETITION_ID } from "@/firebase/firestore";
import { saveQuestionBankMeta } from "@/features/facilitator/question-bank-meta";
import type {
  FullQuestionBankPayload,
  QuestionBankArchiveRecord,
} from "@/features/facilitator/question-bank-types";
import {
  buildArchiveCounts,
  countStage2Questions,
} from "@/features/facilitator/question-bank-workbook-parser";

const BANK_ROOT = ["competitions", MAIN_COMPETITION_ID, "questionBanks"] as const;
const ARCHIVES_PARENT_DOC = "meta";

function stageDoc(stage: "stage1" | "stage2" | "stage3" | "stage4") {
  return doc(getClientFirestore(), ...BANK_ROOT, stage);
}

function archivesCollection() {
  return collection(getClientFirestore(), ...BANK_ROOT, ARCHIVES_PARENT_DOC, "archives");
}

function archiveDoc(id: string) {
  return doc(getClientFirestore(), ...BANK_ROOT, ARCHIVES_PARENT_DOC, "archives", id);
}

export async function saveFullQuestionBank(payload: FullQuestionBankPayload): Promise<void> {
  const now = serverTimestamp();

  await Promise.all([
    setDoc(stageDoc("stage1"), {
      questions: payload.stage1,
      count: payload.stage1.length,
      updatedAt: now,
    }),
    setDoc(stageDoc("stage2"), {
      ...payload.stage2,
      count: countStage2Questions(payload.stage2),
      updatedAt: now,
    }),
    setDoc(stageDoc("stage3"), {
      questions: payload.stage3,
      count: Object.keys(payload.stage3).length,
      updatedAt: now,
    }),
    setDoc(stageDoc("stage4"), {
      questions: payload.stage4,
      count: payload.stage4.length,
      updatedAt: now,
    }),
    saveQuestionBankMeta({
      bankSizes: {
        stage1: payload.stage1.length,
        stage2: countStage2Questions(payload.stage2),
        stage3: Object.keys(payload.stage3).length,
        stage4: payload.stage4.length,
      },
      stage2ReadingReference: payload.meta.stage2ReadingReference,
      stage2ReadingPassage: payload.meta.stage2ReadingPassage,
    }),
  ]);
}

export async function createQuestionBankArchive(input: {
  name: string;
  governorate: string;
  sourceFileName: string;
  payload: FullQuestionBankPayload;
  archiveId?: string;
}): Promise<string> {
  const id =
    input.archiveId ??
    `archive-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const counts = buildArchiveCounts(input.payload);
  const now = serverTimestamp();

  await setDoc(archiveDoc(id), {
    name: input.name.trim() || "أرشيف بدون اسم",
    governorate: input.governorate.trim(),
    sourceFileName: input.sourceFileName,
    counts,
    payload: input.payload,
    createdAt: now,
    updatedAt: now,
  });

  return id;
}

export async function listQuestionBankArchives(): Promise<QuestionBankArchiveRecord[]> {
  const snapshot = await getDocs(query(archivesCollection(), orderBy("updatedAt", "desc")));
  return snapshot.docs.map((entry) => {
    const data = entry.data();
    return {
      id: entry.id,
      name: typeof data.name === "string" ? data.name : "أرشيف",
      governorate: typeof data.governorate === "string" ? data.governorate : "",
      sourceFileName: typeof data.sourceFileName === "string" ? data.sourceFileName : "",
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      counts:
        data.counts && typeof data.counts === "object"
          ? (data.counts as QuestionBankArchiveRecord["counts"])
          : { stage1: 0, stage2: 0, stage3: 0, stage4: 0, total: 0 },
      payload: data.payload as FullQuestionBankPayload,
    };
  });
}

export function subscribeQuestionBankArchives(
  onChange: (archives: QuestionBankArchiveRecord[]) => void,
): () => void {
  return onSnapshot(query(archivesCollection(), orderBy("updatedAt", "desc")), (snapshot) => {
    onChange(
      snapshot.docs.map((entry) => {
        const data = entry.data();
        return {
          id: entry.id,
          name: typeof data.name === "string" ? data.name : "أرشيف",
          governorate: typeof data.governorate === "string" ? data.governorate : "",
          sourceFileName: typeof data.sourceFileName === "string" ? data.sourceFileName : "",
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          counts:
            data.counts && typeof data.counts === "object"
              ? (data.counts as QuestionBankArchiveRecord["counts"])
              : { stage1: 0, stage2: 0, stage3: 0, stage4: 0, total: 0 },
          payload: data.payload as FullQuestionBankPayload,
        };
      }),
    );
  });
}

export async function loadQuestionBankArchive(archiveId: string): Promise<void> {
  const snapshot = await getDoc(archiveDoc(archiveId));
  if (!snapshot.exists()) {
    throw new Error("Archive not found.");
  }
  const data = snapshot.data();
  const payload = data.payload as FullQuestionBankPayload;
  await saveFullQuestionBank(payload);
  await updateDoc(archiveDoc(archiveId), { updatedAt: serverTimestamp() });
}

export async function renameQuestionBankArchive(archiveId: string, name: string): Promise<void> {
  await updateDoc(archiveDoc(archiveId), {
    name: name.trim() || "أرشيف",
    updatedAt: serverTimestamp(),
  });
}

export async function updateQuestionBankArchiveMeta(
  archiveId: string,
  patch: { name?: string; governorate?: string },
): Promise<void> {
  await updateDoc(archiveDoc(archiveId), {
    ...(patch.name !== undefined ? { name: patch.name.trim() || "أرشيف" } : {}),
    ...(patch.governorate !== undefined ? { governorate: patch.governorate.trim() } : {}),
    updatedAt: serverTimestamp(),
  });
}

export async function deleteQuestionBankArchive(archiveId: string): Promise<void> {
  await deleteDoc(archiveDoc(archiveId));
}

export async function backupCurrentQuestionBank(label: string): Promise<string | null> {
  const [s1, s2, s3, s4] = await Promise.all([
    getDoc(stageDoc("stage1")),
    getDoc(stageDoc("stage2")),
    getDoc(stageDoc("stage3")),
    getDoc(stageDoc("stage4")),
  ]);

  const stage1 = Array.isArray(s1.data()?.questions) ? s1.data()?.questions : [];
  const stage2Data = s2.data() ?? {};
  const stage3Raw = s3.data()?.questions;
  const stage4 = Array.isArray(s4.data()?.questions) ? s4.data()?.questions : [];

  const hasData =
    stage1.length > 0 ||
    Object.keys(stage3Raw ?? {}).length > 0 ||
    stage4.length > 0 ||
    (Array.isArray(stage2Data.matching) && stage2Data.matching.length > 0);

  if (!hasData) {
    return null;
  }

  const payload: FullQuestionBankPayload = {
    stage1,
    stage2: {
      matching: Array.isArray(stage2Data.matching) ? stage2Data.matching : [],
      arrangeVerse: Array.isArray(stage2Data.arrangeVerse) ? stage2Data.arrangeVerse : [],
      completeVerse: Array.isArray(stage2Data.completeVerse) ? stage2Data.completeVerse : [],
      trueFalseCorrect: Array.isArray(stage2Data.trueFalseCorrect)
        ? stage2Data.trueFalseCorrect
        : [],
    },
    stage3: stage3Raw && typeof stage3Raw === "object" ? stage3Raw : {},
    stage4,
    meta: {
      bankSizes: {
        stage1: stage1.length,
        stage2: 0,
        stage3: Object.keys(stage3Raw ?? {}).length,
        stage4: stage4.length,
      },
      stage2ReadingReference: "",
      stage2ReadingPassage: "",
    },
  };

  return createQuestionBankArchive({
    name: label,
    governorate: "",
    sourceFileName: "auto-backup",
    payload,
    archiveId: `backup-${Date.now()}`,
  });
}
