import type { Stage1MockQuestion } from "@/features/stage1/stage1-types";

/**
 * Dev mock bank (6 questions, all four official/old types).
 * Consumed via `stage1-question-bank.ts` — append rows here or swap for JSON import (up to 50).
 * See docs/stage1-question-bank-audit.md and docs/stage1-compliance-repair.md
 */
export const stage1MockQuestions: Stage1MockQuestion[] = [
  {
    id: "stage1-missing-1",
    type: "missing",
    prompt: "أكمل الآية: الرب نوري و... ممن أخاف؟",
    reference: "مزمور 27: 1",
    correctAnswer: "خلاصي",
  },
  {
    id: "stage1-fill-1",
    type: "fill_blank",
    prompt: "أكمل: الرب راعي فلا ____ شيء.",
    reference: "مزمور 23: 1",
    correctAnswer: "يعوزني",
  },
  {
    id: "stage1-choice-1",
    type: "multiple_choice",
    prompt: "من هو النبي الذي ألقاه إخوته في الجب؟",
    options: ["يوسف", "موسى", "إيليا", "يونان"],
    correctAnswer: "يوسف",
  },
  {
    id: "stage1-choice-2",
    type: "multiple_choice",
    prompt: "كم تلميذاً اختار السيد المسيح؟",
    options: ["12", "7", "10", "40"],
    correctAnswer: "12",
  },
  {
    id: "stage1-arrange-1",
    type: "arrange",
    prompt: "رتب كلمات الآية:",
    reference: "مزمور 119: 105",
    parts: ["مصباح", "لرجلي", "كلامك", "ونور", "لسبيلي"],
    correctOrder: ["مصباح", "لرجلي", "كلامك", "ونور", "لسبيلي"],
    correctAnswer: "مصباح | لرجلي | كلامك | ونور | لسبيلي",
  },
  {
    id: "stage1-arrange-2",
    type: "arrange",
    prompt: "رتب كلمات العبارة:",
    parts: ["المحبة", "لا", "تسقط", "أبداً"],
    correctOrder: ["المحبة", "لا", "تسقط", "أبداً"],
    correctAnswer: "المحبة | لا | تسقط | أبداً",
  },
];
