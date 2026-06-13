"use client";

import { serverTimestamp, setDoc } from "firebase/firestore";
import { timerRef } from "@/firebase/firestore";

export const STAGE2_READING_DURATION_SECONDS = 180;

export function buildStage2ReadingTimerPayload(
  seconds = STAGE2_READING_DURATION_SECONDS,
  now = Date.now(),
) {
  return {
    active: true,
    stage: "stage2" as const,
    purpose: "reading" as const,
    durationSeconds: seconds,
    startedAtMs: now,
    endsAtMs: now + seconds * 1000,
    paused: false,
    pausedRemainingMs: 0,
    updatedAt: serverTimestamp(),
  };
}

export async function startStage2ReadingTimerDoc(
  seconds = STAGE2_READING_DURATION_SECONDS,
  now = Date.now(),
) {
  await setDoc(timerRef, buildStage2ReadingTimerPayload(seconds, now), {
    merge: true,
  });
}
