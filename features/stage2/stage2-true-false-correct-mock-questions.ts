import type { Stage2TrueFalseCorrectQuestion } from "@/features/stage2/stage2-true-false-correct-types";

export const STAGE2_TRUE_FALSE_CORRECT_REFERENCE = "يوحنا 15: 1-17";

export const stage2TrueFalseCorrectMockQuestions: Stage2TrueFalseCorrectQuestion[] = [
  {
    id: "stage2-true-false-correct-1",
    statement: "قال يسوع: أنا الكرمة الحقيقية وأبي الكرام.",
    correctIsTrue: true,
    reference: STAGE2_TRUE_FALSE_CORRECT_REFERENCE,
  },
  {
    id: "stage2-true-false-correct-2",
    statement: "قال يسوع: بدوني تقدرون أن تصنعوا كثيراً.",
    correctIsTrue: false,
    expectedCorrection: "بدوني لا تقدرون أن تصنعوا شيئاً",
    reference: STAGE2_TRUE_FALSE_CORRECT_REFERENCE,
  },
  {
    id: "stage2-true-false-correct-3",
    statement: "قال يسوع: أنا الكرمة وأنتم الأغصان.",
    correctIsTrue: true,
    reference: STAGE2_TRUE_FALSE_CORRECT_REFERENCE,
  },
  {
    id: "stage2-true-false-correct-4",
    statement: "قال يسوع: من لا يثبت فيّ يثمر كثيراً.",
    correctIsTrue: false,
    expectedCorrection: "من يثبت فيّ و أنا فيه يثمر كثيراً",
    reference: STAGE2_TRUE_FALSE_CORRECT_REFERENCE,
  },
  {
    id: "stage2-true-false-correct-5",
    statement: "قال يسوع: إن لم يثبت أحد فيَّ يُطرح خارجاً كالغصن.",
    correctIsTrue: true,
    reference: STAGE2_TRUE_FALSE_CORRECT_REFERENCE,
  },
];

export const STAGE2_TRUE_FALSE_CORRECT_QUESTION_COUNT =
  stage2TrueFalseCorrectMockQuestions.length;
