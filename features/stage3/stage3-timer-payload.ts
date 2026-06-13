import type { FieldValue } from "firebase/firestore";
import {
  STAGE3_ANSWER_DURATION_SECONDS,
  STAGE3_REVEAL_DURATION_SECONDS,
  STAGE3_SELECTION_DURATION_SECONDS,
} from "@/features/stage3/stage3-official-constants";

export function buildStage3SelectionTimerPayload(
  now: number,
  updatedAt: FieldValue,
  seconds = STAGE3_SELECTION_DURATION_SECONDS,
) {
  return {
    active: true,
    stage: "stage3" as const,
    purpose: "selection" as const,
    durationSeconds: seconds,
    startedAtMs: now,
    endsAtMs: now + seconds * 1000,
    paused: false,
    pausedRemainingMs: 0,
    updatedAt,
  };
}

export function buildStage3AnsweringTimerPayload(
  now: number,
  updatedAt: FieldValue,
  seconds = STAGE3_ANSWER_DURATION_SECONDS,
) {
  return {
    active: true,
    stage: "stage3" as const,
    purpose: "answering" as const,
    durationSeconds: seconds,
    startedAtMs: now,
    endsAtMs: now + seconds * 1000,
    paused: false,
    pausedRemainingMs: 0,
    updatedAt,
  };
}

export function buildStage3RevealTimerPayload(
  now: number,
  updatedAt: FieldValue,
  seconds = STAGE3_REVEAL_DURATION_SECONDS,
) {
  return {
    active: true,
    stage: "stage3" as const,
    purpose: "reveal" as const,
    durationSeconds: seconds,
    startedAtMs: now,
    endsAtMs: now + seconds * 1000,
    paused: false,
    pausedRemainingMs: 0,
    updatedAt,
  };
}
