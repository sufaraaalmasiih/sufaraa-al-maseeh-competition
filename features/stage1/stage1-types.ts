export type Stage1QuestionType =
  | "missing"
  | "multiple_choice"
  | "arrange"
  | "fill_blank";

export interface Stage1BaseQuestion {
  id: string;
  type: Stage1QuestionType;
  prompt: string;
  reference?: string;
  imageUrl?: string;
  correctAnswer: string;
  /** تجاوز اختياري لنقاط الإجابة الصحيحة (بدل افتراضي المرحلة). */
  points?: number;
}

export function isStage1QuestionType(value: string): value is Stage1QuestionType {
  return (
    value === "missing" ||
    value === "multiple_choice" ||
    value === "arrange" ||
    value === "fill_blank"
  );
}

/** ماذا ينقص — typed missing word/phrase (old project). */
export interface Stage1MissingQuestion extends Stage1BaseQuestion {
  type: "missing";
}

/** فراغات — typed fill-in-the-blank (old project). */
export interface Stage1FillBlankQuestion extends Stage1BaseQuestion {
  type: "fill_blank";
}

export interface Stage1ChoiceQuestion extends Stage1BaseQuestion {
  type: "multiple_choice";
  options: string[];
}

/** رتّب — tap-to-order fragments (old project). */
export interface Stage1ArrangeQuestion extends Stage1BaseQuestion {
  type: "arrange";
  parts: string[];
  /** Canonical order; defaults to `parts` when omitted. */
  correctOrder?: string[];
}

export type Stage1MockQuestion =
  | Stage1MissingQuestion
  | Stage1FillBlankQuestion
  | Stage1ChoiceQuestion
  | Stage1ArrangeQuestion;

export function getStage1QuestionTypeLabel(type: Stage1QuestionType): string {
  switch (type) {
    case "missing":
      return "ماذا ينقص";
    case "fill_blank":
      return "فراغات";
    case "multiple_choice":
      return "اختر من متعدد";
    case "arrange":
      return "رتّب";
    default:
      return type;
  }
}
