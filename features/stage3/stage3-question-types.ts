export type Stage3Difficulty = "easy" | "medium" | "hard";

export interface Stage3QuestionMetadata {
  id: string;
  fieldId: string;
  fieldLabel: string;
  difficulty: Stage3Difficulty;
  questionNumber: number;
}

/** Temporary gameFlow fields for Sprint 4.3 foundation sync (not final schema) */
export interface Stage3GameFlowSession {
  stage3ActiveQuestion: Stage3QuestionMetadata | null;
  stage3OpenedQuestionIds: string[];
}

export const STAGE3_DIFFICULTY_LABELS: Record<Stage3Difficulty, string> = {
  easy: "سهل",
  medium: "متوسط",
  hard: "صعب",
};

export const STAGE3_OWNER_TEAM_PLACEHOLDER = "فريق صاحب الدور — سيتم تحديده لاحقاً";

export const STAGE3_QUESTION_TEXT_PLACEHOLDER =
  "سيتم ربط السؤال الحقيقي في Sprint 4.4";
