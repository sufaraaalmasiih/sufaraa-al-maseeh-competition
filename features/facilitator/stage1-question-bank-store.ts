"use client";

import { doc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { getClientFirestore } from "@/firebase/firebaseClient";
import { MAIN_COMPETITION_ID } from "@/firebase/firestore";
import {
  parseStage1Questions,
  parseStage1RowsToQuestions,
} from "@/features/facilitator/stage1-question-bank-parser";
import { stage1MockQuestions } from "@/features/stage1/stage1-mock-questions";
import type { Stage1MockQuestion } from "@/features/stage1/stage1-types";
import { sanitizeStage1BankForTeam } from "@/lib/sanitize-question-bank";

export { parseStage1Questions, parseStage1RowsToQuestions };

function bankDocRef() {
  return doc(getClientFirestore(), "competitions", MAIN_COMPETITION_ID, "questionBanks", "stage1");
}

export async function saveStage1Bank(questions: Stage1MockQuestion[]): Promise<void> {
  await setDoc(bankDocRef(), {
    questions,
    count: questions.length,
    updatedAt: serverTimestamp(),
  });
}

// ---- Live cache shared with gameplay -------------------------------------

let cache: Stage1MockQuestion[] | null = null;
let subscribed = false;
let sanitizeForTeamPlayback = false;
const listeners = new Set<() => void>();

export function setStage1BankSanitizeForTeamPlayback(enabled: boolean): void {
  sanitizeForTeamPlayback = enabled;
}

function getRawStage1Bank(): Stage1MockQuestion[] {
  return cache && cache.length > 0 ? cache : [...stage1MockQuestions];
}

function startSubscription() {
  if (subscribed) {
    return;
  }
  subscribed = true;
  onSnapshot(
    bankDocRef(),
    (snapshot) => {
      const parsed = parseStage1Questions(snapshot.data()?.questions);
      cache = parsed.length > 0 ? parsed : null;
      listeners.forEach((listener) => listener());
    },
    () => {
      // Keep the static fallback bank on read errors.
    },
  );
}

/** Active gameplay bank: sanitized for team playback when the flag is set. */
export function getActiveStage1Bank(): Stage1MockQuestion[] {
  const bank = getRawStage1Bank();
  return sanitizeForTeamPlayback ? sanitizeStage1BankForTeam(bank) : bank;
}

/** Full bank with answers intact — used for facilitator scoring and labels. */
export function getAuthoritativeStage1Bank(): Stage1MockQuestion[] {
  return getRawStage1Bank();
}

/** Resolve a question from the raw bank by id (for authoritative scoring). */
export function getAuthoritativeStage1Question(
  questionId: string,
): Stage1MockQuestion | null {
  return getAuthoritativeStage1Bank().find((question) => question.id === questionId) ?? null;
}

/** Subscribe to bank changes so consumers re-render when it updates. */
export function useStage1BankSync(): void {
  const [, setVersion] = useState(0);
  useEffect(() => {
    startSubscription();
    const listener = () => setVersion((value) => value + 1);
    listeners.add(listener);
    listener();
    return () => {
      listeners.delete(listener);
    };
  }, []);
}

/** Editor hook for the facilitator panel: the stored bank with loading/error. */
export function useStage1BankEditor() {
  const [questions, setQuestions] = useState<Stage1MockQuestion[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return onSnapshot(
      bankDocRef(),
      (snapshot) => {
        setQuestions(parseStage1Questions(snapshot.data()?.questions));
        setError(null);
        setLoading(false);
      },
      () => {
        setError("تعذر تحميل بنك الأسئلة.");
        setLoading(false);
      },
    );
  }, []);

  return { questions, loading, error };
}
