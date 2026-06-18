"use client";

import { serverTimestamp, setDoc } from "firebase/firestore";
import { timerRef } from "@/firebase/firestore";
import { getSyncedNowMs } from "@/lib/server-clock-sync";

export const STAGE2_ANSWERING_DEFAULT_SECONDS = 150;

export function buildStage2AnsweringTimerPayload(
  seconds = STAGE2_ANSWERING_DEFAULT_SECONDS,
  now = getSyncedNowMs(),
) {
  return {
    active: true,
    stage: "stage2" as const,
    purpose: "answering" as const,
    durationSeconds: seconds,
    startedAtMs: now,
    endsAtMs: now + seconds * 1000,
    paused: false,
    pausedRemainingMs: 0,
    updatedAt: serverTimestamp(),
  };
}

export async function startStage2AnsweringTimerDoc(
  seconds = STAGE2_ANSWERING_DEFAULT_SECONDS,
  now = getSyncedNowMs(),
) {
  await setDoc(timerRef, buildStage2AnsweringTimerPayload(seconds, now), {
    merge: true,
  });
}
