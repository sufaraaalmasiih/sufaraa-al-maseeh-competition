import type { Stage3Difficulty } from "@/features/stage3/stage3-question-types";
import { STAGE3_DIFFICULTY_LABELS } from "@/features/stage3/stage3-question-types";

export type { Stage3Difficulty };

export interface Stage3ScorePreview {
  ownerPoints: number;
  otherTeamsPoints: number;
}

export interface Stage3BoardQuestion {
  id: string;
  fieldKey: string;
  number: number;
  difficulty: Stage3Difficulty;
  difficultyLabel: string;
  scorePreview: Stage3ScorePreview;
}

export interface Stage3BoardField {
  key: string;
  label: string;
  questions: Stage3BoardQuestion[];
}

export const STAGE3_BOARD_TITLE = "لوحة على المحك";

export const STAGE3_SCORE_PREVIEW_BY_DIFFICULTY: Record<
  Stage3Difficulty,
  Stage3ScorePreview
> = {
  easy: { ownerPoints: 15, otherTeamsPoints: 5 },
  medium: { ownerPoints: 30, otherTeamsPoints: 10 },
  hard: { ownerPoints: 45, otherTeamsPoints: 15 },
};

/** Fixed difficulty order per field: 2 easy, 2 medium, 2 hard */
export const STAGE3_FIELD_DIFFICULTY_SEQUENCE: Stage3Difficulty[] = [
  "easy",
  "easy",
  "medium",
  "medium",
  "hard",
  "hard",
];

/** Five active fields for Sprint 4.2 mock board (أقوال excluded this sprint) */
export const STAGE3_BOARD_FIELD_DEFINITIONS = [
  { key: "characters", label: "شخصيات" },
  { key: "miracles", label: "معجزات" },
  { key: "parables", label: "أمثال" },
  { key: "timePlace", label: "زمان ومكان" },
  { key: "numbers", label: "أعداد" },
] as const;

function buildFieldQuestions(
  fieldKey: string,
): Stage3BoardQuestion[] {
  return STAGE3_FIELD_DIFFICULTY_SEQUENCE.map((difficulty, index) => {
    const number = index + 1;

    return {
      id: `${fieldKey}_q${number}`,
      fieldKey,
      number,
      difficulty,
      difficultyLabel: STAGE3_DIFFICULTY_LABELS[difficulty],
      scorePreview: STAGE3_SCORE_PREVIEW_BY_DIFFICULTY[difficulty],
    };
  });
}

export const STAGE3_BOARD_FIELDS: Stage3BoardField[] =
  STAGE3_BOARD_FIELD_DEFINITIONS.map((field) => ({
    key: field.key,
    label: field.label,
    questions: buildFieldQuestions(field.key),
  }));

export const STAGE3_BOARD_QUESTION_COUNT =
  STAGE3_BOARD_FIELDS.length * STAGE3_FIELD_DIFFICULTY_SEQUENCE.length;

/** أقصى عدد مجالات (أعمدة) في لوحة المرحلة 3 — التصميم يتكيّف من 1 إلى 6. */
export const STAGE3_MAX_FIELDS = 6;

interface Stage3BankFieldInput {
  id: string;
  fieldId: string;
  fieldLabel: string;
  difficulty: Stage3Difficulty;
  questionNumber: number;
}

/**
 * يبني أعمدة اللوحة من أسئلة البنك الفعلية: يجمّعها حسب المجال (fieldId) بترتيب
 * أول ظهور، يستخدم الاسم المخصّص (fieldLabel)، حتى 6 مجالات، وكل مجال يعرض ما له
 * من خلايا مرتّبة برقم السؤال. هكذا تتكيّف اللوحة (تصغر/تكبر) مع محتوى البنك.
 */
export function buildStage3BoardFields(
  questions: Stage3BankFieldInput[],
): Stage3BoardField[] {
  const order: string[] = [];
  const byField = new Map<string, { label: string; questions: Stage3BoardQuestion[] }>();

  for (const question of questions) {
    const key = question.fieldId;
    if (!key) {
      continue;
    }
    if (!byField.has(key)) {
      if (order.length >= STAGE3_MAX_FIELDS) {
        continue;
      }
      order.push(key);
      byField.set(key, { label: question.fieldLabel || key, questions: [] });
    }
    const entry = byField.get(key);
    if (!entry) {
      continue;
    }
    if (!entry.label && question.fieldLabel) {
      entry.label = question.fieldLabel;
    }
    entry.questions.push({
      id: question.id,
      fieldKey: key,
      number: question.questionNumber,
      difficulty: question.difficulty,
      difficultyLabel: STAGE3_DIFFICULTY_LABELS[question.difficulty],
      scorePreview: STAGE3_SCORE_PREVIEW_BY_DIFFICULTY[question.difficulty],
    });
  }

  return order.map((key) => {
    const entry = byField.get(key);
    const list = entry ? [...entry.questions].sort((a, b) => a.number - b.number) : [];
    return { key, label: entry?.label || key, questions: list };
  });
}
