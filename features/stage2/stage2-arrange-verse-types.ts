export interface Stage2ArrangeVerseQuestion {
  id: string;
  prompt: string;
  fragments: string[];
  correctOrder: string[];
  reference: string;
  imageUrl?: string;
  /** تجاوز نقاط اختياري للإجابة الصحيحة (بدل 15). */
  points?: number;
}

export interface Stage2ArrangeVerseAnswer {
  questionId: string;
  orderedFragments: string[];
  confirmed: boolean;
}
