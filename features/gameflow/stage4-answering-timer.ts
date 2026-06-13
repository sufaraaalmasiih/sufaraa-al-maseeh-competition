import type { FieldValue } from "firebase/firestore";

export const STAGE4_ANSWERING_DEFAULT_SECONDS = 60;

export function buildStage4AnsweringTimerPayload(
  now: number,
  updatedAt: FieldValue,
  seconds = STAGE4_ANSWERING_DEFAULT_SECONDS,
) {
  return {
    active: true,
    stage: "stage4" as const,
    purpose: "answering" as const,
    durationSeconds: seconds,
    startedAtMs: now,
    endsAtMs: now + seconds * 1000,
    paused: false,
    pausedRemainingMs: 0,
    updatedAt,
  };
}
