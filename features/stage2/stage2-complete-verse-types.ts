export interface Stage2CompleteVerseQuestion {
  id: string;
  prompt: string;
  verseWithBlank: string;
  correctAnswer: string;
  reference: string;
}

export interface Stage2CompleteVerseAnswer {
  questionId: string;
  typedAnswer: string;
  confirmed: boolean;
}
