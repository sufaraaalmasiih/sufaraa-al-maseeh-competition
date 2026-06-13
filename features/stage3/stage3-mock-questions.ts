import { STAGE3_BOARD_FIELDS } from "@/features/stage3/stage3-board-data";

export interface Stage3MockQuestion {
  id: string;
  prompt: string;
  options: string[];
  correctAnswer: string;
}

const OPTION_LABELS = ["أ", "ب", "ج", "د"] as const;

function buildMockQuestion(questionId: string, fieldLabel: string, number: number): Stage3MockQuestion {
  const correctIndex = (number - 1) % OPTION_LABELS.length;
  const correctAnswer = OPTION_LABELS[correctIndex];
  const options = [...OPTION_LABELS];

  return {
    id: questionId,
    prompt: `(${fieldLabel}) سؤال ${number}: اختر الإجابة الصحيحة — ${questionId}`,
    options,
    correctAnswer,
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

export function getStage3MockQuestion(questionId: string): Stage3MockQuestion | null {
  return MOCK_QUESTIONS[questionId] ?? null;
}
