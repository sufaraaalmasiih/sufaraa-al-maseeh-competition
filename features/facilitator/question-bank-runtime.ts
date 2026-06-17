"use client";

import { doc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";
import { getClientFirebaseAuth, getClientFirestore } from "@/firebase/firebaseClient";
import { MAIN_COMPETITION_ID } from "@/firebase/firestore";
import type { Stage2QuestionBank, Stage3BankQuestion } from "@/features/facilitator/question-bank-types";
import {
  setRuntimeStage2Bank,
  setRuntimeStage3Bank,
  setRuntimeStage4Bank,
  setQuestionBankSanitizeForTeamPlayback,
} from "@/features/facilitator/question-bank-runtime-cache";
import type { Stage2ArrangeVerseQuestion } from "@/features/stage2/stage2-arrange-verse-types";
import type { Stage2CompleteVerseQuestion } from "@/features/stage2/stage2-complete-verse-types";
import type { Stage2MatchingQuestion } from "@/features/stage2/stage2-matching-types";
import type { Stage2TrueFalseCorrectQuestion } from "@/features/stage2/stage2-true-false-correct-types";
import type { Stage4QuestionMetadata } from "@/features/stage4/stage4-question-types";
import { subscribeFirestoreDoc } from "@/lib/firestore-listener";
import { useAuthRole } from "@/hooks/use-auth-role";

export {
  getActiveStage2Bank,
  getActiveStage2MatchingQuestions,
  getActiveStage2ArrangeVerseQuestions,
  getActiveStage2CompleteVerseQuestions,
  getActiveStage2TrueFalseQuestions,
  getActiveStage4Questions,
  getActiveStage4QuestionByIndex,
  getActiveStage4Question,
} from "@/features/facilitator/question-bank-runtime-cache";

const BANK_ROOT = ["competitions", MAIN_COMPETITION_ID, "questionBanks"] as const;

let subscribed = false;
let authWaitStarted = false;
const listeners = new Set<() => void>();
const bankUnsubscribes: Array<() => void> = [];

function notify() {
  listeners.forEach((listener) => listener());
}

function parseStage2Data(data: Record<string, unknown> | undefined): Stage2QuestionBank | null {
  if (!data) {
    return null;
  }
  const matching = Array.isArray(data.matching) ? (data.matching as Stage2MatchingQuestion[]) : [];
  const arrangeVerse = Array.isArray(data.arrangeVerse)
    ? (data.arrangeVerse as Stage2ArrangeVerseQuestion[])
    : [];
  const completeVerse = Array.isArray(data.completeVerse)
    ? (data.completeVerse as Stage2CompleteVerseQuestion[])
    : [];
  const trueFalseCorrect = Array.isArray(data.trueFalseCorrect)
    ? (data.trueFalseCorrect as Stage2TrueFalseCorrectQuestion[])
    : [];

  const hasData =
    matching.length > 0 ||
    arrangeVerse.length > 0 ||
    completeVerse.length > 0 ||
    trueFalseCorrect.length > 0;

  return hasData ? { matching, arrangeVerse, completeVerse, trueFalseCorrect } : null;
}

function startBankListeners(): void {
  if (subscribed) {
    return;
  }
  subscribed = true;

  bankUnsubscribes.push(
    subscribeFirestoreDoc(doc(getClientFirestore(), ...BANK_ROOT, "stage2"), (snapshot) => {
      setRuntimeStage2Bank(parseStage2Data(snapshot.data()));
      notify();
    }),
  );

  bankUnsubscribes.push(
    subscribeFirestoreDoc(doc(getClientFirestore(), ...BANK_ROOT, "stage3"), (snapshot) => {
      const raw = snapshot.data()?.questions;
      setRuntimeStage3Bank(
        raw && typeof raw === "object" && Object.keys(raw).length > 0
          ? (raw as Record<string, Stage3BankQuestion>)
          : null,
      );
      notify();
    }),
  );

  bankUnsubscribes.push(
    subscribeFirestoreDoc(doc(getClientFirestore(), ...BANK_ROOT, "stage4"), (snapshot) => {
      const questions = snapshot.data()?.questions;
      setRuntimeStage4Bank(
        Array.isArray(questions) && questions.length > 0
          ? (questions as Stage4QuestionMetadata[])
          : null,
      );
      notify();
    }),
  );
}

function ensureAuthBeforeSubscription(): void {
  if (subscribed || authWaitStarted) {
    return;
  }
  authWaitStarted = true;

  const auth = getClientFirebaseAuth();
  if (auth.currentUser) {
    startBankListeners();
    return;
  }

  const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
    if (!user || subscribed) {
      return;
    }
    startBankListeners();
    unsubscribeAuth();
  });
}

export function useQuestionBankRuntimeSync(): void {
  const { role } = useAuthRole();
  const [, setVersion] = useState(0);

  useEffect(() => {
    const isStaff = role === "facilitator" || role === "super_admin";
    setQuestionBankSanitizeForTeamPlayback(!isStaff);
  }, [role]);

  useEffect(() => {
    ensureAuthBeforeSubscription();
    const listener = () => setVersion((value) => value + 1);
    listeners.add(listener);
    listener();
    return () => {
      listeners.delete(listener);
    };
  }, []);
}
