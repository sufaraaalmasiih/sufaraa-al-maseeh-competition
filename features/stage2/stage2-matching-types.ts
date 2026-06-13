export interface Stage2MatchingPair {
  left: string;
  correctRight: string;
}

export interface Stage2MatchingQuestion {
  id: string;
  prompt: string;
  reference: string;
  pairs: Stage2MatchingPair[];
  /** Right-column options (include all correct answers + distractors). */
  rightOptions: string[];
}

export interface Stage2MatchingAnswer {
  questionId: string;
  pairings: Record<string, string>;
  confirmed: boolean;
}
