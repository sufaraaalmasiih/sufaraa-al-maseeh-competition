export type Stage2TrueFalseChoice = "true" | "false";

export interface Stage2TrueFalseCorrectQuestion {
  id: string;
  statement: string;
  correctIsTrue: boolean;
  expectedCorrection?: string;
  /** الجزء الخطأ المتوقّع في الجملة (للتحكيم التلقائي) — من عمود «الجزء المطلوب». */
  expectedWrongPart?: string;
  reference: string;
  imageUrl?: string;
}

export interface Stage2TrueFalseCorrectAnswer {
  questionId: string;
  selectedIsTrue: boolean;
  /** الجزء الذي حدّده المتسابق كخطأ من الجملة (عند اختيار «خطأ»). */
  selectedWrongPart: string;
  correctionText: string;
  confirmed: boolean;
}
