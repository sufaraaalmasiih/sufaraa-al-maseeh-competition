import { getAuthoritativeRuntimeStage3Question, getRuntimeStage3Question } from "@/features/facilitator/question-bank-runtime-cache";
import type { Stage1MockQuestion, Stage1QuestionType } from "@/features/stage1/stage1-types";
import { STAGE3_BOARD_FIELDS } from "@/features/stage3/stage3-board-data";

export type Stage3MockQuestion = Stage1MockQuestion;

const STAGE3_QUESTION_TYPES: Stage1QuestionType[] = [
  "multiple_choice",
  "missing",
  "fill_blank",
  "arrange",
];

const OPTION_LABELS = ["أ", "ب", "ج", "د"] as const;

function buildMockQuestion(
  questionId: string,
  fieldLabel: string,
  number: number,
): Stage3MockQuestion {
  const type = STAGE3_QUESTION_TYPES[(number - 1) % STAGE3_QUESTION_TYPES.length];
  const prompt = `(${fieldLabel}) سؤال ${number}: ${questionId}`;

  if (type === "multiple_choice") {
    const correctIndex = (number - 1) % OPTION_LABELS.length;
    return {
      id: questionId,
      type,
      prompt,
      options: [...OPTION_LABELS],
      correctAnswer: OPTION_LABELS[correctIndex],
    };
  }

  if (type === "arrange") {
    const parts = ["الله", "محبة", "العالم"];
    return {
      id: questionId,
      type,
      prompt: `${prompt} — رتّب الكلمات`,
      parts,
      correctAnswer: parts.join(" | "),
    };
  }

  if (type === "missing") {
    return {
      id: questionId,
      type,
      prompt: `${prompt} — ماذا ينقص؟`,
      correctAnswer: "الإيمان",
    };
  }

  return {
    id: questionId,
    type: "fill_blank",
    prompt: `${prompt} — أكمل الفراغ`,
    correctAnswer: "الخلاص",
  };
}

const MOCK_QUESTIONS: Record<string, Stage3MockQuestion> = {};

for (const field of STAGE3_BOARD_FIELDS) {
  for (const question of field.questions) {
    MOCK_QUESTIONS[question.id] = buildMockQuestion(
      question.id,
      field.label,
      question.number,
    );
  }
}

export function getStage3MockQuestionForPlay(questionId: string): Stage3MockQuestion | null {
  return getRuntimeStage3Question(questionId) ?? MOCK_QUESTIONS[questionId] ?? null;
}

export function getStage3MockQuestionForScoring(questionId: string): Stage3MockQuestion | null {
  return getAuthoritativeRuntimeStage3Question(questionId) ?? MOCK_QUESTIONS[questionId] ?? null;
}

export function getStage3MockQuestion(questionId: string): Stage3MockQuestion | null {
  return getStage3MockQuestionForScoring(questionId);
}
