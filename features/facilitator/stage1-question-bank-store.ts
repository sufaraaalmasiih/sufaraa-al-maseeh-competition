"use client";

import { doc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { firestore } from "@/firebase/firebaseClient";
import { MAIN_COMPETITION_ID } from "@/firebase/firestore";
import { stage1MockQuestions } from "@/features/stage1/stage1-mock-questions";
import type {
  Stage1MockQuestion,
  Stage1QuestionType,
} from "@/features/stage1/stage1-types";

function bankDocRef() {
  return doc(firestore, "competitions", MAIN_COMPETITION_ID, "questionBanks", "stage1");
}

const VALID_TYPES: Stage1QuestionType[] = [
  "missing",
  "multiple_choice",
  "arrange",
  "fill_blank",
];

const TYPE_ALIASES: Record<string, Stage1QuestionType> = {
  missing: "missing",
  "ماذا ينقص": "missing",
  fill_blank: "fill_blank",
  fill: "fill_blank",
  فراغات: "fill_blank",
  multiple_choice: "multiple_choice",
  mcq: "multiple_choice",
  choice: "multiple_choice",
  "اختر من متعدد": "multiple_choice",
  arrange: "arrange",
  رتب: "arrange",
  "رتّب": "arrange",
};

function str(value: unknown): string {
  return typeof value === "string" ? value.trim() : value == null ? "" : String(value).trim();
}

function splitList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => str(item)).filter(Boolean);
  }
  return str(value)
    .split(/[|\n;]+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function resolveType(value: unknown): Stage1QuestionType | null {
  const key = str(value).toLowerCase();
  if (TYPE_ALIASES[key]) {
    return TYPE_ALIASES[key];
  }
  return VALID_TYPES.includes(key as Stage1QuestionType)
    ? (key as Stage1QuestionType)
    : null;
}

/** Validate/normalize a stored or imported question; null when unusable. */
function normalizeQuestion(raw: unknown, fallbackIndex: number): Stage1MockQuestion | null {
  const entry = (raw ?? {}) as Record<string, unknown>;
  const type = resolveType(entry.type);
  const prompt = str(entry.prompt);
  const correctAnswer = str(entry.correctAnswer);

  if (!type || !prompt) {
    return null;
  }

  const id = str(entry.id) || `stage1-import-${fallbackIndex + 1}`;
  const reference = str(entry.reference) || undefined;

  if (type === "multiple_choice") {
    const options = splitList(entry.options);
    if (options.length < 2 || !correctAnswer) {
      return null;
    }
    return { id, type, prompt, reference, correctAnswer, options };
  }

  if (type === "arrange") {
    const parts = splitList(entry.parts);
    if (parts.length < 2) {
      return null;
    }
    const correctOrder = splitList(entry.correctOrder);
    return {
      id,
      type,
      prompt,
      reference,
      correctAnswer: correctAnswer || parts.join(" "),
      parts,
      ...(correctOrder.length > 0 ? { correctOrder } : {}),
    };
  }

  if (!correctAnswer) {
    return null;
  }
  return { id, type, prompt, reference, correctAnswer };
}

export function parseStage1Questions(raw: unknown): Stage1MockQuestion[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw
    .map((entry, index) => normalizeQuestion(entry, index))
    .filter((entry): entry is Stage1MockQuestion => entry !== null);
}

/** Convert spreadsheet rows (xlsx/csv) into validated stage-1 questions. */
export function parseStage1RowsToQuestions(
  rows: Record<string, unknown>[],
): Stage1MockQuestion[] {
  return rows
    .map((row, index) => {
      const lower: Record<string, unknown> = {};
      Object.entries(row).forEach(([key, value]) => {
        lower[key.trim().toLowerCase()] = value;
      });
      return normalizeQuestion(
        {
          id: lower.id,
          type: lower.type ?? lower["النوع"],
          prompt: lower.prompt ?? lower["السؤال"],
          reference: lower.reference ?? lower["الشاهد"] ?? lower["المرجع"],
          correctAnswer:
            lower.correctanswer ?? lower["الإجابة"] ?? lower["الاجابة"] ?? lower.answer,
          options: lower.options ?? lower["الخيارات"],
          parts: lower.parts ?? lower["الأجزاء"] ?? lower["الاجزاء"],
          correctOrder: lower.correctorder ?? lower["الترتيب"],
        },
        index,
      );
    })
    .filter((entry): entry is Stage1MockQuestion => entry !== null);
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
const listeners = new Set<() => void>();

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

/** Active gameplay bank: the Firestore bank when present, else the static one. */
export function getActiveStage1Bank(): Stage1MockQuestion[] {
  return cache && cache.length > 0 ? cache : [...stage1MockQuestions];
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
