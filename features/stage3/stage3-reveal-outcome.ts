import type { Stage3AnswerOutcome } from "@/features/stage3/stage3-scoring";

export interface Stage3RevealAnswerSource {
  passed: boolean;
  isCorrect: boolean;
  outcome?: Stage3AnswerOutcome;
  pointsDelta: number;
}

export function formatStage3RevealOutcome(source: Stage3RevealAnswerSource): string {
  if (source.passed) {
    return "تجاوز";
  }

  if (source.outcome === "selection_timeout") {
    return "لم يُختر سؤال";
  }

  if (source.outcome === "no_answer") {
    return "لم يجيب";
  }

  return source.isCorrect ? "صحيحة" : "خاطئة";
}

export function formatStage3RevealAnswerDisplay(
  answer: string,
  passed: boolean,
  outcome?: Stage3RevealAnswerSource["outcome"],
): string {
  if (passed) {
    return "تجاوز";
  }

  if (outcome === "selection_timeout") {
    return "لم يُختر سؤال";
  }

  if (outcome === "no_answer") {
    return "لم يجيب";
  }

  return answer.length > 0 ? answer : "—";
}

export function formatStage3PointsDelta(pointsDelta: number): string {
  if (pointsDelta > 0) {
    return `+${pointsDelta}`;
  }

  return String(pointsDelta);
}
