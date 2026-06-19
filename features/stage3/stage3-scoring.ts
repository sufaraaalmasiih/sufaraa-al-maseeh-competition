import type { Stage3Difficulty } from "@/features/stage3/stage3-question-types";

export type Stage3AnswerOutcome = "correct" | "wrong" | "no_answer" | "pass" | "selection_timeout";

const OWNER_POINTS: Record<
  Stage3Difficulty,
  Record<Exclude<Stage3AnswerOutcome, "pass">, number>
> = {
  easy: { correct: 15, wrong: -5, no_answer: -5, selection_timeout: -5 },
  medium: { correct: 30, wrong: -10, no_answer: -10, selection_timeout: -10 },
  hard: { correct: 45, wrong: -15, no_answer: -15, selection_timeout: -15 },
};

const OTHER_POINTS: Record<
  Stage3Difficulty,
  Record<Stage3AnswerOutcome, number>
> = {
  easy: { correct: 5, wrong: -5, no_answer: 0, pass: 0, selection_timeout: 0 },
  medium: { correct: 10, wrong: -10, no_answer: 0, pass: 0, selection_timeout: 0 },
  hard: { correct: 15, wrong: -15, no_answer: 0, pass: 0, selection_timeout: 0 },
};

export function computeStage3PointsDelta(
  isOwner: boolean,
  difficulty: Stage3Difficulty,
  outcome: Stage3AnswerOutcome,
  collective = false,
  overridePoints?: number,
): number {
  // تجاوز نقاط لكل سؤال (يُحدِّده المنظِّم): يُطبَّق على الإجابة الصحيحة فقط.
  // المالك يأخذ النقاط المحدّدة، وبقية الفرق ثلثها (بنفس نسبة الافتراضي 1:3).
  // الخصومات وعدم الإجابة والتخطّي تبقى على قيم المستوى.
  if (typeof overridePoints === "number" && overridePoints > 0 && outcome === "correct") {
    const otherShare = Math.max(1, Math.round(overridePoints / 3));
    if (collective) {
      return otherShare;
    }
    return isOwner ? overridePoints : otherShare;
  }

  // سؤال جماعي (زائد): لا أفضلية لصاحب الدور — نقاط مسطّحة للجميع،
  // وكل الفرق تجيب أو تتخطّى بلا خصم (النقطة 15).
  if (collective) {
    return OTHER_POINTS[difficulty][outcome];
  }

  if (isOwner) {
    if (outcome === "pass") {
      throw new Error("Owner team cannot pass.");
    }

    return OWNER_POINTS[difficulty][outcome];
  }

  return OTHER_POINTS[difficulty][outcome];
}

/** عدد الأسئلة الزائدة التي لا تنقسم على عدد الفرق (تصبح جماعية). */
export function getStage3LeftoverCount(
  totalQuestions: number,
  teamCount: number,
): number {
  if (teamCount <= 0 || totalQuestions <= 0) {
    return 0;
  }
  return totalQuestions % teamCount;
}

/**
 * هل السؤال المختار الآن (حسب عدد الأسئلة المُستخدمة قبله، 0-based) من الأسئلة
 * الزائدة الجماعية؟ الأسئلة الزائدة هي الأخيرة في المسابقة.
 * مثال: 25 سؤال / 4 فرق ⇐ البواقي 1 ⇐ السؤال رقم 25 (الأخير) جماعي.
 */
export function isStage3CollectiveSelection(
  usedBeforeThis: number,
  totalQuestions: number,
  teamCount: number,
): boolean {
  const leftover = getStage3LeftoverCount(totalQuestions, teamCount);
  if (leftover <= 0) {
    return false;
  }
  return usedBeforeThis >= totalQuestions - leftover;
}

export function resolveStage3AnswerOutcome(
  passed: boolean,
  isCorrect: boolean,
): Stage3AnswerOutcome {
  if (passed) {
    return "pass";
  }

  return isCorrect ? "correct" : "wrong";
}
