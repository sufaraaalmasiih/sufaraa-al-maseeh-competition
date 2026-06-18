"use client";

import { getDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { gameFlowRef } from "@/firebase/firestore";

export interface FacilitatorTimerDurations {
  stage1: number;
  stage2Reading: number;
  stage2Turn: number;
  stage3Selection: number;
  stage3Answer: number;
  stage3Reveal: number;
  stage4Selection: number;
  stage4Answer: number;
  stage4Reveal: number;
}

export const DEFAULT_TIMER_DURATIONS: FacilitatorTimerDurations = {
  stage1: 420,
  stage2Reading: 180,
  stage2Turn: 150,
  stage3Selection: 15,
  stage3Answer: 20,
  stage3Reveal: 10,
  stage4Selection: 15,
  stage4Answer: 60,
  stage4Reveal: 10,
};

/**
 * Normalize the `durations` map stored on the gameFlow document. All competition
 * screens (facilitator/team/audience) read the same Firestore values, so the
 * facilitator's configured durations stay in sync across every device.
 */
export function parseTimerDurations(raw: unknown): FacilitatorTimerDurations {
  const parsed = (raw ?? {}) as Partial<FacilitatorTimerDurations>;
  return {
    stage1: numberOr(parsed.stage1, DEFAULT_TIMER_DURATIONS.stage1),
    stage2Reading: numberOr(parsed.stage2Reading, DEFAULT_TIMER_DURATIONS.stage2Reading),
    stage2Turn: numberOr(parsed.stage2Turn, DEFAULT_TIMER_DURATIONS.stage2Turn),
    stage3Selection: numberOr(parsed.stage3Selection, DEFAULT_TIMER_DURATIONS.stage3Selection),
    stage3Answer: numberOr(parsed.stage3Answer, DEFAULT_TIMER_DURATIONS.stage3Answer),
    stage3Reveal: numberOr(parsed.stage3Reveal, DEFAULT_TIMER_DURATIONS.stage3Reveal),
    stage4Selection: numberOr(parsed.stage4Selection, DEFAULT_TIMER_DURATIONS.stage4Selection),
    stage4Answer: numberOr(parsed.stage4Answer, DEFAULT_TIMER_DURATIONS.stage4Answer),
    stage4Reveal: numberOr(parsed.stage4Reveal, DEFAULT_TIMER_DURATIONS.stage4Reveal),
  };
}

/** Read the configured durations from Firestore (gameFlow.durations). */
export async function fetchTimerDurations(): Promise<FacilitatorTimerDurations> {
  try {
    const snapshot = await getDoc(gameFlowRef);
    return parseTimerDurations(snapshot.data()?.durations);
  } catch {
    return { ...DEFAULT_TIMER_DURATIONS };
  }
}

/** Persist the durations to Firestore so every screen reads the same values. */
export async function writeTimerDurations(
  durations: FacilitatorTimerDurations,
): Promise<void> {
  await updateDoc(gameFlowRef, {
    durations: parseTimerDurations(durations),
    updatedAt: serverTimestamp(),
  });
}

function numberOr(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? value
    : fallback;
}
