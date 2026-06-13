import { normalizeStage2AnswerText } from "@/features/stage2/stage2-answer-validation";
import type { Stage4QuestionMetadata } from "@/features/stage4/stage4-question-types";

function answersMatch(submitted: string, expected: string): boolean {
  return normalizeStage2AnswerText(submitted) === normalizeStage2AnswerText(expected);
}

export function validateStage4Answer(
  question: Stage4QuestionMetadata,
  answerText: string,
): boolean {
  const normalizedSubmitted = normalizeStage2AnswerText(answerText);

  if (answersMatch(normalizedSubmitted, question.correctAnswer)) {
    return true;
  }

  const accepted = question.acceptedAnswers ?? [];

  return accepted.some((candidate) => answersMatch(normalizedSubmitted, candidate));
}
