export interface Stage2CompleteVerseQuestion {
  id: string;
  prompt: string;
  verseWithBlank: string;
  correctAnswer: string;
  reference: string;
  imageUrl?: string;
  /** تجاوز نقاط اختياري للإجابة الصحيحة (بدل 15). */
  points?: number;
}

export interface Stage2CompleteVerseAnswer {
  questionId: string;
  typedAnswer: string;
  confirmed: boolean;
}
