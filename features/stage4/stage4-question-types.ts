export type Stage4QuestionType = "link" | "image" | "who_am_i";

export interface Stage4QuestionMetadata {
  id: string;
  type: Stage4QuestionType;
  prompt: string;
  imageUrl?: string;
  clue?: string;
  linkText?: string;
  correctAnswer: string;
  acceptedAnswers?: string[];
  order: number;
}
