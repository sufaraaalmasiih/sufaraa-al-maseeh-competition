import type { Stage3Difficulty } from "@/features/stage3/stage3-question-types";

export type Stage3AnswerOutcome = "correct" | "wrong" | "no_answer" | "pass" | "selection_timeout";

const OWNER_POINTS: Record<
  Stage3Difficulty,
  Record<Exclude<Stage3AnswerOutcome, "pass">, number>
> = {
  easy: { correct: 15, wrong: -5, no_answer: -5 },
  medium: { correct: 30, wrong: -10, no_answer: -10 },
  hard: { correct: 45, wrong: -15, no_answer: -15 },
};

const OTHER_POINTS: Record<
  Stage3Difficulty,
  Record<Stage3AnswerOutcome, number>
> = {
  easy: { correct: 5, wrong: -5, no_answer: 0, pass: 0 },
  medium: { correct: 10, wrong: -10, no_answer: 0, pass: 0 },
  hard: { correct: 15, wrong: -15, no_answer: 0, pass: 0 },
};

export function computeStage3PointsDelta(
  isOwner: boolean,
  difficulty: Stage3Difficulty,
  outcome: Stage3AnswerOutcome,
): number {
  if (isOwner) {
    if (outcome === "pass") {
      throw new Error("Owner team cannot pass.");
    }

    return OWNER_POINTS[difficulty][outcome];
  }

  return OTHER_POINTS[difficulty][outcome];
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
