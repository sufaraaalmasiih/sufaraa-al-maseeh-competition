export type Stage2TrueFalseChoice = "true" | "false";

export interface Stage2TrueFalseCorrectQuestion {
  id: string;
  statement: string;
  correctIsTrue: boolean;
  expectedCorrection?: string;
  reference: string;
  imageUrl?: string;
}

export interface Stage2TrueFalseCorrectAnswer {
  questionId: string;
  selectedIsTrue: boolean;
  correctionText: string;
  confirmed: boolean;
}
