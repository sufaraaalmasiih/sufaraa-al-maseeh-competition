import { getActiveStage1Bank } from "@/features/facilitator/stage1-question-bank-store";
import {
  getAuthoritativeRuntimeStage3Question,
  getAuthoritativeStage2ArrangeVerseQuestion,
  getAuthoritativeStage2CompleteVerseQuestion,
  getAuthoritativeStage2MatchingQuestion,
  getAuthoritativeStage2TrueFalseQuestion,
  getAuthoritativeStage4Question,
} from "@/features/facilitator/question-bank-runtime-cache";
import type { Stage2ArrangeVerseQuestion } from "@/features/stage2/stage2-arrange-verse-types";
import type { Stage2MatchingQuestion } from "@/features/stage2/stage2-matching-types";
import type { Stage2TrueFalseCorrectQuestion } from "@/features/stage2/stage2-true-false-correct-types";
import { getStage1ArrangeExpectedAnswer } from "@/features/stage1/stage1-arrange";
import type { Stage1ArrangeQuestion } from "@/features/stage1/stage1-types";
import { getStage3MockQuestion } from "@/features/stage3/stage3-mock-questions";

export interface ResolveAnswerCorrectLabelInput {
  stage: string;
  questionId?: string | null;
  field?: string | null;
}

function formatMatchingCorrectAnswer(question: Stage2MatchingQuestion): string {
  return question.pairs
    .map((pair) => `${pair.left} → ${pair.correctRight}`)
    .join(" · ");
}

function formatArrangeCorrectAnswer(question: Stage2ArrangeVerseQuestion): string {
  return question.correctOrder.join(" ");
}

function formatTrueFalseCorrectAnswer(question: Stage2TrueFalseCorrectQuestion): string {
  if (question.correctIsTrue) {
    return question.expectedCorrection
      ? `صواب (${question.expectedCorrection})`
      : "صواب";
  }

  return question.expectedCorrection
    ? `خطأ — ${question.expectedCorrection}`
    : "خطأ";
}

function resolveStage2CorrectLabel(
  questionId: string,
  field?: string | null,
): string | null {
  if (!field || field === "matching") {
    const matching = getAuthoritativeStage2MatchingQuestion(questionId);
    if (matching) {
      return formatMatchingCorrectAnswer(matching);
    }
  }

  if (!field || field === "arrangeVerse") {
    const arrange = getAuthoritativeStage2ArrangeVerseQuestion(questionId);
    if (arrange) {
      return formatArrangeCorrectAnswer(arrange);
    }
  }

  if (!field || field === "completeVerse") {
    const complete = getAuthoritativeStage2CompleteVerseQuestion(questionId);
    if (complete) {
      return complete.correctAnswer;
    }
  }

  if (!field || field === "trueFalseCorrect") {
    const trueFalse = getAuthoritativeStage2TrueFalseQuestion(questionId);
    if (trueFalse) {
      return formatTrueFalseCorrectAnswer(trueFalse);
    }
  }

  return null;
}

export function resolveAnswerCorrectLabel({
  stage,
  questionId,
  field,
}: ResolveAnswerCorrectLabelInput): string | null {
  if (!questionId) {
    return null;
  }

  if (stage === "stage1") {
    const question = getActiveStage1Bank().find((item) => item.id === questionId);
    if (!question) {
      return null;
    }
    if (question.type === "arrange") {
      return getStage1ArrangeExpectedAnswer(question as Stage1ArrangeQuestion);
    }
    return question.correctAnswer ?? null;
  }

  if (stage === "stage2") {
    return resolveStage2CorrectLabel(questionId, field);
  }

  if (stage === "stage3") {
    const bankQuestion = getAuthoritativeRuntimeStage3Question(questionId);
    const mockQuestion = getStage3MockQuestion(questionId);
    return bankQuestion?.correctAnswer ?? mockQuestion?.correctAnswer ?? null;
  }

  if (stage === "stage4") {
    const question = getAuthoritativeStage4Question(questionId);
    return question?.correctAnswer ?? null;
  }

  return null;
}
