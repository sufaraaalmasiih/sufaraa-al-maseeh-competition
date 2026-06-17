export interface Stage2ArrangeVerseQuestion {
  id: string;
  prompt: string;
  fragments: string[];
  correctOrder: string[];
  reference: string;
  imageUrl?: string;
}

export interface Stage2ArrangeVerseAnswer {
  questionId: string;
  orderedFragments: string[];
  confirmed: boolean;
}
