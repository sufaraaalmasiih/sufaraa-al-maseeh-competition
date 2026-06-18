import type { Stage2MatchingQuestion } from "@/features/stage2/stage2-matching-types";

export const STAGE2_MATCHING_REFERENCE = "يوحنا 15: 1-17";

export const stage2MatchingMockQuestions: Stage2MatchingQuestion[] = [
  {
    id: "stage2-matching-set-1",
    prompt: "وصّل كل عبارة بما يناسبها",
    reference: STAGE2_MATCHING_REFERENCE,
    pairs: [
      { left: "أنا الكرمة الحقيقية", correctRight: "أبي الكرام" },
      { left: "أنتم الأغصان", correctRight: "الكرمة" },
      { left: "من يثبت فيّ وأنا فيه", correctRight: "كثيراً" },
      { left: "إن لم يثبت أحد فيَّ", correctRight: "الغصن" },
      { left: "لأن بدوني", correctRight: "تصنعوا شيئاً" },
    ],
    rightOptions: [
      "أبي الكرام",
      "الكرمة",
      "كثيراً",
      "الغصن",
      "تصنعوا شيئاً",
    ],
  },
];

export const STAGE2_MATCHING_QUESTION_COUNT = stage2MatchingMockQuestions.length;
