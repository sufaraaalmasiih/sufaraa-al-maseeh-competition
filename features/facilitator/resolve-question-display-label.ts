import { getAuthoritativeStage1Question } from "@/features/facilitator/stage1-question-bank-store";
import {
  getAuthoritativeRuntimeStage3Question,
  getAuthoritativeStage2ArrangeVerseQuestion,
  getAuthoritativeStage2CompleteVerseQuestion,
  getAuthoritativeStage2MatchingQuestion,
  getAuthoritativeStage2TrueFalseQuestion,
  getAuthoritativeStage4Question,
} from "@/features/facilitator/question-bank-runtime-cache";
import { STAGE3_DIFFICULTY_LABELS } from "@/features/stage3/stage3-question-types";
import { getStage3MockQuestion } from "@/features/stage3/stage3-mock-questions";

export interface ResolveQuestionDisplayLabelInput {
  stage: string;
  questionId?: string | null;
  questionText?: string | null;
  field?: string | null;
  fieldId?: string | null;
  difficulty?: string | null;
  questionIndex?: number | null;
}

function trimText(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function isTechnicalQuestionText(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  return (
    normalized.startsWith("stage") ||
    normalized.includes("selection_timeout") ||
    normalized === "سؤال مسابقة"
  );
}

export function resolveQuestionDisplayLabel(input: ResolveQuestionDisplayLabelInput): string {
  const stored = trimText(input.questionText);
  if (stored && !isTechnicalQuestionText(stored)) {
    return stored;
  }

  const questionId = trimText(input.questionId);
  if (!questionId) {
    return stored ?? "سؤال مسابقة";
  }

  if (input.stage === "stage1") {
    const question = getAuthoritativeStage1Question(questionId);
    return trimText(question?.prompt) ?? stored ?? "سؤال المرحلة الأولى";
  }

  if (input.stage === "stage2") {
    const field = trimText(input.field);
    const matching = getAuthoritativeStage2MatchingQuestion(questionId);
    if (matching) {
      return trimText(matching.prompt) ?? stored ?? "سؤال توصيل";
    }
    const arrange = getAuthoritativeStage2ArrangeVerseQuestion(questionId);
    if (arrange) {
      return trimText(arrange.prompt) ?? stored ?? "سؤال ترتيب آية";
    }
    const complete = getAuthoritativeStage2CompleteVerseQuestion(questionId);
    if (complete) {
      return trimText(complete.prompt) ?? stored ?? "سؤال إكمال آية";
    }
    const trueFalse = getAuthoritativeStage2TrueFalseQuestion(questionId);
    if (trueFalse) {
      return trimText(trueFalse.statement) ?? stored ?? "سؤال صح أو خطأ";
    }
    if (field) {
      return `سؤال ${field}`;
    }
    return stored ?? "سؤال المرحلة الثانية";
  }

  if (input.stage === "stage3") {
    const bankQuestion = getAuthoritativeRuntimeStage3Question(questionId);
    const mockQuestion = getStage3MockQuestion(questionId);
    const prompt = trimText(bankQuestion?.prompt) ?? trimText(mockQuestion?.prompt);
    if (prompt) {
      return prompt;
    }

    const fieldId = trimText(input.fieldId);
    const difficulty =
      bankQuestion?.difficulty ??
      (input.difficulty === "easy" || input.difficulty === "medium" || input.difficulty === "hard"
        ? input.difficulty
        : null);
    if (fieldId && difficulty) {
      const difficultyLabel = STAGE3_DIFFICULTY_LABELS[difficulty];
      const questionNumber =
        typeof bankQuestion?.questionNumber === "number" && bankQuestion.questionNumber > 0
          ? bankQuestion.questionNumber
          : typeof input.questionIndex === "number"
            ? input.questionIndex + 1
            : null;
      if (questionNumber) {
        return `سؤال ${questionNumber} — ${fieldId} (${difficultyLabel})`;
      }
      return `${fieldId} (${difficultyLabel})`;
    }

    return stored ?? "سؤال المرحلة الثالثة";
  }

  if (input.stage === "stage4") {
    const question = getAuthoritativeStage4Question(questionId);
    return trimText(question?.prompt) ?? stored ?? "سؤال المرحلة الرابعة";
  }

  return stored ?? "سؤال مسابقة";
}
