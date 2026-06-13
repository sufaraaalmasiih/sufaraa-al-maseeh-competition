import { stage2AnswersMatch } from "@/features/stage2/stage2-answer-validation";
import type {
  Stage2TrueFalseChoice,
  Stage2TrueFalseCorrectQuestion,
} from "@/features/stage2/stage2-true-false-correct-types";

export function evaluateTrueFalseCorrectAnswer(
  question: Stage2TrueFalseCorrectQuestion,
  selectedChoice: Stage2TrueFalseChoice,
  correctionText: string,
): boolean {
  if (question.correctIsTrue) {
    return selectedChoice === "true";
  }

  if (selectedChoice === "true") {
    return false;
  }

  const expectedCorrection = question.expectedCorrection?.trim() ?? "";
  if (!expectedCorrection) {
    return true;
  }

  return stage2AnswersMatch(correctionText, expectedCorrection);
}

export function serializeTrueFalseCorrectAnswer(
  selectedChoice: Stage2TrueFalseChoice,
  correctionText: string,
): string {
  const choiceLabel = selectedChoice === "true" ? "صح" : "خطأ";
  const trimmedCorrection = correctionText.trim();
  if (selectedChoice === "false" && trimmedCorrection) {
    return `${choiceLabel} | ${trimmedCorrection}`;
  }
  return choiceLabel;
}
