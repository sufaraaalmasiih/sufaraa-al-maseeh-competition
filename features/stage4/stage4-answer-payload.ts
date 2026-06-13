import type { FieldValue, Timestamp } from "firebase/firestore";

interface BuildStage4AnswerPayloadInput {
  teamId: string;
  teamName: string;
  questionId: string;
  answerText: string;
  passed: boolean;
  isCorrect: boolean;
  pointsDelta: number;
  streakBefore: number;
  streakAfter: number;
  answeredAt: Timestamp | FieldValue;
  createdAt: Timestamp | FieldValue;
  updatedAt: Timestamp | FieldValue;
}

export function buildStage4AnswerPayload(input: BuildStage4AnswerPayloadInput) {
  return {
    stage: "stage4" as const,
    questionId: input.questionId,
    teamId: input.teamId,
    teamName: input.teamName,
    answerText: input.answerText,
    selectedAnswer: input.answerText,
    passed: input.passed === true,
    isCorrect: input.isCorrect === true,
    pointsDelta: input.pointsDelta,
    streakBefore: input.streakBefore,
    streakAfter: input.streakAfter,
    confirmed: true,
    answeredAt: input.answeredAt,
    createdAt: input.createdAt,
    updatedAt: input.updatedAt,
  };
}
