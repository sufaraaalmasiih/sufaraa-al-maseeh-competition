import type { FieldValue, Timestamp } from "firebase/firestore";
import type { Stage3Difficulty } from "@/features/stage3/stage3-question-types";
import type { Stage3AnswerOutcome } from "@/features/stage3/stage3-scoring";

export interface Stage3AnswerDocument {
  teamId: string;
  teamName: string;
  stage: "stage3";
  questionId: string;
  fieldId: string;
  difficulty: Stage3Difficulty;
  isOwner: boolean;
  role: "owner" | "other";
  answer: string;
  selectedAnswer: string;
  passed: boolean;
  confirmed: boolean;
  confirmedAt: Timestamp | FieldValue;
  isCorrect: boolean;
  outcome?: Stage3AnswerOutcome;
  pointsDelta: number;
  visibleToAudience: boolean;
  createdAt: Timestamp | FieldValue;
  updatedAt: Timestamp | FieldValue;
}

export interface ConfirmStage3AnswerResult {
  duplicate: boolean;
  isCorrect: boolean;
  pointsDelta: number;
  passed: boolean;
}
