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
