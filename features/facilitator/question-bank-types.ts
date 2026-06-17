import type { Stage1MockQuestion } from "@/features/stage1/stage1-types";
import type { Stage2ArrangeVerseQuestion } from "@/features/stage2/stage2-arrange-verse-types";
import type { Stage2CompleteVerseQuestion } from "@/features/stage2/stage2-complete-verse-types";
import type { Stage2MatchingQuestion } from "@/features/stage2/stage2-matching-types";
import type { Stage2TrueFalseCorrectQuestion } from "@/features/stage2/stage2-true-false-correct-types";
import type { Stage3Difficulty } from "@/features/stage3/stage3-question-types";
import type { Stage4QuestionMetadata } from "@/features/stage4/stage4-question-types";
import type { WorkbookBankStats } from "@/features/facilitator/question-bank-meta";

export type Stage3BankQuestion = Stage1MockQuestion & {
  fieldId: string;
  fieldLabel: string;
  difficulty: Stage3Difficulty;
  questionNumber: number;
};

export interface Stage2QuestionBank {
  matching: Stage2MatchingQuestion[];
  arrangeVerse: Stage2ArrangeVerseQuestion[];
  completeVerse: Stage2CompleteVerseQuestion[];
  trueFalseCorrect: Stage2TrueFalseCorrectQuestion[];
}

export interface FullQuestionBankPayload {
  stage1: Stage1MockQuestion[];
  stage2: Stage2QuestionBank;
  stage3: Record<string, Stage3BankQuestion>;
  stage4: Stage4QuestionMetadata[];
  meta: WorkbookBankStats;
}

export interface QuestionBankArchiveRecord {
  id: string;
  name: string;
  governorate: string;
  sourceFileName: string;
  createdAt: unknown;
  updatedAt: unknown;
  counts: {
    stage1: number;
    stage2: number;
    stage3: number;
    stage4: number;
    total: number;
  };
  payload: FullQuestionBankPayload;
}
