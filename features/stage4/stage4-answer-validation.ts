import type { Stage1MockQuestion } from "@/features/stage1/stage1-types";
import { evaluateStage1Answer } from "@/features/stage1/stage1-answer-validation";
import { normalizeStage2AnswerText } from "@/features/stage2/stage2-answer-validation";
import {
  isStage4FlexibleType,
  type Stage4QuestionMetadata,
} from "@/features/stage4/stage4-question-types";

function answersMatch(submitted: string, expected: string): boolean {
  return normalizeStage2AnswerText(submitted) === normalizeStage2AnswerText(expected);
}

export function validateStage4Answer(
  question: Stage4QuestionMetadata,
  answerText: string,
): boolean {
  if (isStage4FlexibleType(question.type)) {
    return evaluateStage1Answer(question as Stage1MockQuestion, answerText);
  }

  const normalizedSubmitted = normalizeStage2AnswerText(answerText);

  if (answersMatch(normalizedSubmitted, question.correctAnswer)) {
    return true;
  }

  const accepted = question.acceptedAnswers ?? [];

  return accepted.some((candidate) => answersMatch(normalizedSubmitted, candidate));
}
