import type { Stage2CompleteVerseQuestion } from "@/features/stage2/stage2-complete-verse-types";

export const STAGE2_COMPLETE_VERSE_REFERENCE = "يوحنا 15: 1-17";

export const stage2CompleteVerseMockQuestions: Stage2CompleteVerseQuestion[] = [
  {
    id: "stage2-complete-verse-1",
    prompt: "أكمل الآية التالية",
    verseWithBlank: "أنا الكرمة وأنتم ____",
    correctAnswer: "الأغصان",
    reference: STAGE2_COMPLETE_VERSE_REFERENCE,
  },
  {
    id: "stage2-complete-verse-2",
    prompt: "أكمل الآية التالية",
    verseWithBlank: "أنا الكرمة الحقيقية و____ الكرام",
    correctAnswer: "أبي",
    reference: STAGE2_COMPLETE_VERSE_REFERENCE,
  },
  {
    id: "stage2-complete-verse-3",
    prompt: "أكمل الآية التالية",
    verseWithBlank: "من يثبت فيّ و____ فيه يثمر كثيراً",
    correctAnswer: "أنا",
    reference: STAGE2_COMPLETE_VERSE_REFERENCE,
  },
  {
    id: "stage2-complete-verse-4",
    prompt: "أكمل الآية التالية",
    verseWithBlank: "إن لم ____ أحد فيَّ يُطرح خارجاً كالغصن",
    correctAnswer: "يثبت",
    reference: STAGE2_COMPLETE_VERSE_REFERENCE,
  },
  {
    id: "stage2-complete-verse-5",
    prompt: "أكمل الآية التالية",
    verseWithBlank: "لأن ____ لا تقدرون أن تصنعوا شيئاً",
    correctAnswer: "بدوني",
    reference: STAGE2_COMPLETE_VERSE_REFERENCE,
  },
];

export const STAGE2_COMPLETE_VERSE_QUESTION_COUNT =
  stage2CompleteVerseMockQuestions.length;
