import type { FieldValue, Timestamp } from "firebase/firestore";
import type { Stage3Difficulty } from "@/features/stage3/stage3-question-types";
import type { Stage3AnswerOutcome } from "@/features/stage3/stage3-scoring";

export type Stage3AnswerRole = "owner" | "other";

export interface BuildStage3AnswerPayloadInput {
  teamId: string;
  teamName: string;
  questionId: string;
  fieldId: string;
  difficulty: Stage3Difficulty;
  isOwner: boolean;
  answer: string;
  passed: boolean;
  isCorrect: boolean;
  pointsDelta: number;
  outcome?: Stage3AnswerOutcome;
  confirmedAt: Timestamp | FieldValue;
  createdAt: Timestamp | FieldValue;
  updatedAt: Timestamp | FieldValue;
}

/** Firestore-safe answer document — no undefined fields. */
export function buildStage3AnswerPayload(input: BuildStage3AnswerPayloadInput) {
  const role: Stage3AnswerRole = input.isOwner ? "owner" : "other";

  return {
    teamId: input.teamId,
    teamName: input.teamName,
    stage: "stage3" as const,
    questionId: input.questionId,
    fieldId: input.fieldId,
    difficulty: input.difficulty,
    isOwner: input.isOwner,
    role,
    answer: input.passed ? "" : input.answer,
    selectedAnswer: input.passed ? "" : input.answer,
    passed: Boolean(input.passed),
    confirmed: true,
    confirmedAt: input.confirmedAt,
    isCorrect: input.isCorrect,
    pointsDelta: input.pointsDelta,
    visibleToAudience: false,
    createdAt: input.createdAt,
    updatedAt: input.updatedAt,
    ...(input.outcome ? { outcome: input.outcome } : {}),
  };
}
