import type { Stage2QuestionBank } from "@/features/facilitator/question-bank-types";
import type { Stage3BankQuestion } from "@/features/facilitator/question-bank-types";
import type { Stage1MockQuestion } from "@/features/stage1/stage1-types";
import type { Stage4QuestionMetadata } from "@/features/stage4/stage4-question-types";

function stripStage1Question<T extends Stage1MockQuestion>(question: T): T {
  if (question.type === "arrange") {
    return {
      ...question,
      correctAnswer: "",
      correctOrder: [],
    };
  }

  return {
    ...question,
    correctAnswer: "",
  };
}

export function sanitizeStage2BankForTeam(bank: Stage2QuestionBank): Stage2QuestionBank {
  return {
    matching: bank.matching.map((question) => ({
      ...question,
      pairs: question.pairs.map((pair) => ({ ...pair, correctRight: "" })),
      rightOptions:
        question.rightOptions.length > 0
          ? question.rightOptions
          : [...new Set(question.pairs.map((pair) => pair.correctRight.trim()).filter(Boolean))],
    })),
    arrangeVerse: bank.arrangeVerse.map((question) => ({
      ...question,
      correctOrder: [],
    })),
    completeVerse: bank.completeVerse.map((question) => ({
      ...question,
      correctAnswer: "",
    })),
    trueFalseCorrect: bank.trueFalseCorrect.map((question) => ({
      ...question,
      correctIsTrue: false,
      expectedCorrection: undefined,
    })),
  };
}

export function sanitizeStage3BankForTeam(
  bank: Record<string, Stage3BankQuestion>,
): Record<string, Stage3BankQuestion> {
  return Object.fromEntries(
    Object.entries(bank).map(([id, question]) => [id, stripStage1Question(question)]),
  );
}

export function sanitizeStage4BankForTeam(
  questions: Stage4QuestionMetadata[],
): Stage4QuestionMetadata[] {
  return questions.map((question) => ({
    ...question,
    correctAnswer: "",
    acceptedAnswers: [],
    ...(question.type === "arrange" ? { correctOrder: [] } : {}),
  }));
}
