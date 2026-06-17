import { getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import {
  audienceDisplayRef,
  competitionSessionRef,
  gameFlowRef,
  timerRef,
} from "@/firebase/firestore";
import {
  buildInitialAudienceDisplayPayload,
  buildInitialGameFlowPayload,
  buildInitialSessionPayload,
  buildInitialTimerPayload,
} from "@/lib/competition-initial-payloads";
import { saveQuestionBankMeta } from "@/features/facilitator/question-bank-meta";

export interface CompetitionBootstrapResult {
  created: string[];
  skipped: string[];
}

export class CompetitionBootstrapError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CompetitionBootstrapError";
  }
}

/**
 * Creates missing system documents for a fresh Firestore database.
 * Safe to run multiple times — existing documents are left unchanged.
 */
export async function bootstrapCompetitionDatabase(): Promise<CompetitionBootstrapResult> {
  const created: string[] = [];
  const skipped: string[] = [];

  const [gameFlowSnapshot, timerSnapshot, sessionSnapshot, audienceSnapshot] =
    await Promise.all([
      getDoc(gameFlowRef),
      getDoc(timerRef),
      getDoc(competitionSessionRef),
      getDoc(audienceDisplayRef),
    ]);

  const writes: Promise<void>[] = [];

  if (gameFlowSnapshot.exists()) {
    skipped.push("gameFlow");
  } else {
    writes.push(setDoc(gameFlowRef, buildInitialGameFlowPayload()));
    created.push("gameFlow");
  }

  if (timerSnapshot.exists()) {
    skipped.push("timer");
  } else {
    writes.push(setDoc(timerRef, buildInitialTimerPayload()));
    created.push("timer");
  }

  if (sessionSnapshot.exists()) {
    skipped.push("session");
  } else {
    writes.push(setDoc(competitionSessionRef, buildInitialSessionPayload()));
    created.push("session");
  }

  if (audienceSnapshot.exists()) {
    skipped.push("audienceDisplay");
  } else {
    writes.push(setDoc(audienceDisplayRef, buildInitialAudienceDisplayPayload()));
    created.push("audienceDisplay");
  }

  try {
    await Promise.all(writes);
    await saveQuestionBankMeta({});
  } catch {
    throw new CompetitionBootstrapError("تعذر تهيئة قاعدة البيانات. تحقق من صلاحيات الميسّر.");
  }

  return { created, skipped };
}
