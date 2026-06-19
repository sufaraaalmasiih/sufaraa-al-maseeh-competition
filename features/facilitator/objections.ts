"use client";

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { getClientFirestore, firebaseAuth } from "@/firebase/firebaseClient";
import { gameFlowRef, MAIN_COMPETITION_ID } from "@/firebase/firestore";

/** الأسباب الشائعة للاعتراض على سؤال. */
export const OBJECTION_REASONS = [
  { id: "wrong_reference", label: "المرجع خاطئ" },
  { id: "spelling_error", label: "خطأ إملائي" },
  { id: "wrong_question", label: "سؤال خاطئ" },
] as const;

export type ObjectionReasonId = (typeof OBJECTION_REASONS)[number]["id"];

export function objectionReasonLabel(id: string): string {
  return OBJECTION_REASONS.find((reason) => reason.id === id)?.label ?? id;
}

export type ObjectionStatus = "open" | "reviewed";

/**
 * يحصر الاعتراضات على المسابقة النشطة فقط — فعند بدء مسابقة جديدة أو إعادة الضبط
 * (sessionId جديد، أو null بعد فصل السجل) يعود العدّاد الحيّ إلى صفر، بينما تبقى
 * اعتراضات المسابقات السابقة محفوظة في الأرشيف (تبويب السجل يعرضها حسب sessionId).
 */
export function objectionsForActiveSession<T extends { sessionId: string | null }>(
  objections: T[],
  activeSessionId: string | null,
): T[] {
  return objections.filter((objection) => objection.sessionId === activeSessionId);
}

export interface CompetitionObjection {
  id: string;
  teamId: string;
  teamName: string;
  questionId: string | null;
  questionLabel: string;
  stage: string;
  reasons: string[];
  note: string;
  sessionId: string | null;
  sessionTitle: string | null;
  status: ObjectionStatus;
  createdAtMs: number;
}

function objectionsCollection() {
  return collection(getClientFirestore(), "competitions", MAIN_COMPETITION_ID, "objections");
}

function objectionDoc(id: string) {
  return doc(getClientFirestore(), "competitions", MAIN_COMPETITION_ID, "objections", id);
}

function num(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function str(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function parseObjection(id: string, data: Record<string, unknown>): CompetitionObjection {
  return {
    id,
    teamId: str(data.teamId),
    teamName: str(data.teamName, "فريق"),
    questionId: typeof data.questionId === "string" ? data.questionId : null,
    questionLabel: str(data.questionLabel, "سؤال"),
    stage: str(data.stage),
    reasons: Array.isArray(data.reasons)
      ? data.reasons.filter((reason): reason is string => typeof reason === "string")
      : [],
    note: str(data.note),
    sessionId: typeof data.sessionId === "string" ? data.sessionId : null,
    sessionTitle: typeof data.sessionTitle === "string" ? data.sessionTitle : null,
    status: data.status === "reviewed" ? "reviewed" : "open",
    createdAtMs: num(data.createdAtMs),
  };
}

/** يرسل اعتراضاً على سؤال ويحفظه في أرشيف الفريق وأرشيف المسابقة (السجل النشط). */
export async function submitObjection(input: {
  teamId: string;
  teamName: string;
  questionId: string | null;
  questionLabel: string;
  stage: string;
  reasons: string[];
  note: string;
}): Promise<void> {
  const reasons = input.reasons.filter(Boolean);
  const note = input.note.trim();

  // النص اختياري إذا اختير سبب، والسبب اختياري إذا كُتب نص — لكن أحدهما إلزامي.
  if (reasons.length === 0 && note.length === 0) {
    throw new Error("اختر سبباً شائعاً أو اكتب نص الاعتراض.");
  }

  let sessionId: string | null = null;
  try {
    const snapshot = await getDoc(gameFlowRef);
    const value = snapshot.data()?.activeSessionId;
    sessionId = typeof value === "string" ? value : null;
  } catch {
    sessionId = null;
  }

  await addDoc(objectionsCollection(), {
    teamId: input.teamId,
    teamName: input.teamName,
    questionId: input.questionId,
    questionLabel: input.questionLabel,
    stage: input.stage,
    reasons,
    note,
    sessionId,
    sessionTitle: null,
    status: "open",
    createdAt: serverTimestamp(),
    createdAtMs: Date.now(),
  });
}

/** يحذف اعتراضات التدريب (التي لا ترتبط بسجل مسابقة رسمية). يُستدعى عند إنهاء تدريب. */
export async function deleteTrainingObjections(): Promise<void> {
  const snapshot = await getDocs(
    query(objectionsCollection(), where("sessionId", "==", null)),
  );
  await Promise.all(snapshot.docs.map((document) => deleteDoc(document.ref)));
}

export async function markObjectionReviewed(id: string): Promise<void> {
  await updateDoc(objectionDoc(id), {
    status: "reviewed",
    reviewedAt: serverTimestamp(),
    reviewedByUid: firebaseAuth.currentUser?.uid ?? null,
  });
}

/** كل الاعتراضات — للميسّر وأرشيف المسابقة. */
export function useObjections() {
  const [objections, setObjections] = useState<CompetitionObjection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return onSnapshot(
      query(objectionsCollection(), orderBy("createdAtMs", "desc")),
      (snapshot) => {
        setObjections(snapshot.docs.map((item) => parseObjection(item.id, item.data())));
        setError(null);
        setLoading(false);
      },
      () => {
        setError("تعذر تحميل الاعتراضات.");
        setLoading(false);
      },
    );
  }, []);

  return { objections, loading, error };
}

/** اعتراضات فريق واحد — لأرشيف الفريق (يعمل للفريق نفسه وللميسّر). */
export function useTeamObjections(teamId: string | null, enabled = true) {
  const [objections, setObjections] = useState<CompetitionObjection[]>([]);
  const [loading, setLoading] = useState(Boolean(teamId) && enabled);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // مستمع عند الطلب فقط (توفير قراءات الباقة المجانية).
    if (!teamId || !enabled) {
      setObjections([]);
      setLoading(false);
      return undefined;
    }

    setLoading(true);
    return onSnapshot(
      query(objectionsCollection(), where("teamId", "==", teamId)),
      (snapshot) => {
        const rows = snapshot.docs
          .map((item) => parseObjection(item.id, item.data()))
          .sort((first, second) => second.createdAtMs - first.createdAtMs);
        setObjections(rows);
        setError(null);
        setLoading(false);
      },
      () => {
        setError("تعذر تحميل اعتراضات الفريق.");
        setLoading(false);
      },
    );
  }, [teamId, enabled]);

  return { objections, loading, error };
}
