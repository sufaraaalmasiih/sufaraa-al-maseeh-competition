import {
  getActiveStage4Question as getCachedStage4Question,
  getActiveStage4QuestionByIndex as getCachedStage4QuestionByIndex,
  getActiveStage4Questions as getCachedStage4Questions,
} from "@/features/facilitator/question-bank-runtime-cache";
import type { Stage4QuestionMetadata } from "@/features/stage4/stage4-question-types";

const MOCK_STAGE4_QUESTIONS: Stage4QuestionMetadata[] = [
  {
    id: "s4-q01",
    type: "link",
    prompt: "ما الرابط بين هذه الكلمات؟",
    linkText: "موسى — العصا — البحر",
    correctAnswer: "الخروج من مصر",
    acceptedAnswers: ["خروج من مصر", "الخروج"],
    order: 1,
  },
  {
    id: "s4-q02",
    type: "who_am_i",
    prompt: "من أنا؟",
    clue: "أنا تلميذٌ سألتُ المسيح: من هو أقرب الناس إليّ؟",
    correctAnswer: "السامري الصالح",
    acceptedAnswers: ["السامري", "سامري صالح"],
    order: 2,
  },
  {
    id: "s4-q03",
    type: "image",
    prompt: "ما هذا الرمز في الكتاب المقدس؟",
    imageUrl: "/images/stage4/olive-branch.svg",
    correctAnswer: "سلام",
    acceptedAnswers: ["السلام"],
    order: 3,
  },
  {
    id: "s4-q04",
    type: "link",
    prompt: "ما الرابط العجيب؟",
    linkText: "خبز — من — السماء",
    correctAnswer: "المنّ",
    acceptedAnswers: ["المن", "من"],
    order: 4,
  },
  {
    id: "s4-q05",
    type: "who_am_i",
    prompt: "من أنا؟",
    clue: "أنا مَلِكٌ طلبتُ حكمةً من الرب فأُعطيتُ فهماً عظيماً.",
    correctAnswer: "سليمان",
    acceptedAnswers: ["الملك سليمان"],
    order: 5,
  },
  {
    id: "s4-q06",
    type: "link",
    prompt: "ما الرابط بين العناصر؟",
    linkText: "سمك — خمسة — خبزتين",
    correctAnswer: "إشباع الجموع",
    acceptedAnswers: ["إشباع الخمسة آلاف", "إشباع الجموع"],
    order: 6,
  },
  {
    id: "s4-q07",
    type: "who_am_i",
    prompt: "من أنا؟",
    clue: "أنا نبيٌّ أُلقي في جبٍّ بسبب صلاتي.",
    correctAnswer: "إرميا",
    acceptedAnswers: ["النبي إرميا"],
    order: 7,
  },
  {
    id: "s4-q08",
    type: "link",
    prompt: "ما الرابط؟",
    linkText: "تين — تينتان — بستان",
    correctAnswer: "موعظة على الجبل",
    acceptedAnswers: ["الموعظة على الجبل"],
    order: 8,
  },
  {
    id: "s4-q09",
    type: "who_am_i",
    prompt: "من أنا؟",
    clue: "أنا تلميذٌ أنكرْتُ معلّمي ثلاث مرات قبل صياح الديك.",
    correctAnswer: "بطرس",
    acceptedAnswers: ["بطرس الرسول", "سمعان بطرس"],
    order: 9,
  },
  {
    id: "s4-q10",
    type: "link",
    prompt: "ما الرابط العجيب؟",
    linkText: "حوت — ثلاثة — أيام",
    correctAnswer: "يونان",
    acceptedAnswers: ["النبي يونان"],
    order: 10,
  },
  {
    id: "s4-q11",
    type: "who_am_i",
    prompt: "من أنا؟",
    clue: "أنا امرأةٌ سقيتُ المسيح من البئر ودعوتُ قريتي.",
    correctAnswer: "السامرية",
    acceptedAnswers: ["المرأة السامرية"],
    order: 11,
  },
  {
    id: "s4-q12",
    type: "link",
    prompt: "ما الرابط؟",
    linkText: "كَبْش — عُلِّق — شجرة",
    correctAnswer: "إسحاق",
    acceptedAnswers: ["ذبيحة إسحاق"],
    order: 12,
  },
  {
    id: "s4-q13",
    type: "who_am_i",
    prompt: "من أنا؟",
    clue: "أنا تلميذٌ طلبتُ أن أجلس عن يمين المسيح في الملكوت.",
    correctAnswer: "يعقوب بن زبدي",
    acceptedAnswers: ["يعقوب", "بن زبدي"],
    order: 13,
  },
  {
    id: "s4-q14",
    type: "link",
    prompt: "ما الرابط العجيب؟",
    linkText: "نار — عمود — ليل",
    correctAnswer: "الخروج من مصر",
    acceptedAnswers: ["عمود النار", "الخروج"],
    order: 14,
  },
  {
    id: "s4-q15",
    type: "who_am_i",
    prompt: "من أنا؟",
    clue: "أنا رسولٌ كُتبتُ له أغلب الرسائل في العهد الجديد.",
    correctAnswer: "بولس",
    acceptedAnswers: ["بولس الرسول", "شاول"],
    order: 15,
  },
  {
    id: "s4-q16",
    type: "multiple_choice",
    prompt: "من هو النبي الذي ابتلعه الحوت؟",
    options: ["يونان", "إرميا", "إيليا", "دانيال"],
    correctAnswer: "يونان",
    order: 16,
  },
  {
    id: "s4-q17",
    type: "missing",
    prompt: "أكمل: «الله ___ العالم»",
    correctAnswer: "محبة",
    acceptedAnswers: ["أحب"],
    order: 17,
  },
  {
    id: "s4-q18",
    type: "fill_blank",
    prompt: "أكمل: «الرب ___ راعيّ فلا ___ شيء»",
    correctAnswer: "راعي | يعوزني",
    acceptedAnswers: ["راعي يعوزني"],
    order: 18,
  },
  {
    id: "s4-q19",
    type: "arrange",
    prompt: "رتّب: «المحبة لا تسقط أبداً»",
    parts: ["المحبة", "لا", "تسقط", "أبداً"],
    correctAnswer: "المحبة | لا | تسقط | أبداً",
    order: 19,
  },
];

export function getStage4MockQuestions(): Stage4QuestionMetadata[] {
  const cached = getCachedStage4Questions();
  return cached.length > 0 ? cached : MOCK_STAGE4_QUESTIONS;
}

export function getStage4MockQuestionByIndex(index: number): Stage4QuestionMetadata | null {
  const cached = getCachedStage4QuestionByIndex(index);
  if (cached) {
    return cached;
  }
  return MOCK_STAGE4_QUESTIONS[index] ?? null;
}

export function getStage4MockQuestion(id: string): Stage4QuestionMetadata | null {
  return getCachedStage4Question(id) ?? MOCK_STAGE4_QUESTIONS.find((q) => q.id === id) ?? null;
}
