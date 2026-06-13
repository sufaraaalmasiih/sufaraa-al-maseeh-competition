import type { Stage2ArrangeVerseQuestion } from "@/features/stage2/stage2-arrange-verse-types";

export const STAGE2_ARRANGE_VERSE_REFERENCE = "يوحنا 15: 1-17";

export const stage2ArrangeVerseMockQuestions: Stage2ArrangeVerseQuestion[] = [
  {
    id: "stage2-arrange-verse-1",
    prompt: "رتب أجزاء الآية بالترتيب الصحيح",
    fragments: ["وأبي الكرام", "أنا الكرمة الحقيقية"],
    correctOrder: ["أنا الكرمة الحقيقية", "وأبي الكرام"],
    reference: STAGE2_ARRANGE_VERSE_REFERENCE,
  },
  {
    id: "stage2-arrange-verse-2",
    prompt: "رتب أجزاء الآية بالترتيب الصحيح",
    fragments: ["وأما أنتم", "فأنتم الأغصان", "أنا الكرمة"],
    correctOrder: ["أنا الكرمة", "وأما أنتم", "فأنتم الأغصان"],
    reference: STAGE2_ARRANGE_VERSE_REFERENCE,
  },
  {
    id: "stage2-arrange-verse-3",
    prompt: "رتب أجزاء الآية بالترتيب الصحيح",
    fragments: ["يُجف", "إن لم يثبت أحد فيّ", "كالغصن"],
    correctOrder: ["إن لم يثبت أحد فيّ", "يُجف", "كالغصن"],
    reference: STAGE2_ARRANGE_VERSE_REFERENCE,
  },
  {
    id: "stage2-arrange-verse-4",
    prompt: "رتب أجزاء الآية بالترتيب الصحيح",
    fragments: ["وثبت كلامي فيكم", "إن ثبتم فيّ", "فاطلبوا ما تريدون"],
    correctOrder: ["إن ثبتم فيّ", "وثبت كلامي فيكم", "فاطلبوا ما تريدون"],
    reference: STAGE2_ARRANGE_VERSE_REFERENCE,
  },
  {
    id: "stage2-arrange-verse-5",
    prompt: "رتب أجزاء الآية بالترتيب الصحيح",
    fragments: ["أنا اخترتكم", "لم تختارونني", "وتأتي أيضاً ثمراً"],
    correctOrder: ["لم تختارونني", "أنا اخترتكم", "وتأتي أيضاً ثمراً"],
    reference: STAGE2_ARRANGE_VERSE_REFERENCE,
  },
];

export const STAGE2_ARRANGE_VERSE_QUESTION_COUNT =
  stage2ArrangeVerseMockQuestions.length;
