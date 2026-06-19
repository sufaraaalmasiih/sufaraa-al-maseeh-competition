"use client";

import { getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { gameFlowRef, timerRef } from "@/firebase/firestore";
import {
  parseTimerDurations,
  type FacilitatorTimerDurations,
} from "@/features/facilitator/facilitator-timer-settings";
import { resolveSyncedNowMs } from "@/lib/server-clock-sync";
import type { CompetitionTimerStage, GameFlowStatus } from "@/types";

interface AnsweringTimerMapping {
  stage: CompetitionTimerStage;
  durationKey: keyof FacilitatorTimerDurations;
}

/** شاشات الإجابة التي يحتاج فيها الفريق العائد مؤقتاً فعّالاً. */
const ANSWERING_STATUS_MAP: Partial<Record<GameFlowStatus, AnsweringTimerMapping>> = {
  stage1_running: { stage: "stage1", durationKey: "stage1" },
  stage2_player_turns: { stage: "stage2", durationKey: "stage2Turn" },
  stage3_question_open: { stage: "stage3", durationKey: "stage3Answer" },
  stage4_question_open: { stage: "stage4", durationKey: "stage4Answer" },
};

/**
 * عند إرسال فريق بعودة استثنائية إلى شاشة إجابة: إذا كان مؤقت تلك المرحلة منتهياً
 * أو غير نشط، يُعاد تشغيله بالمدة المضبوطة حتى يتمكن الفريق العائد من الإجابة.
 * لا يُلمَس مؤقت ما زال يعمل لتلك المرحلة.
 */
export async function resetTimerForExceptionalReturn(
  status: GameFlowStatus,
  force = false,
): Promise<void> {
  const mapping = ANSWERING_STATUS_MAP[status];
  if (!mapping) {
    return;
  }

  const [now, gameFlowSnapshot, timerSnapshot] = await Promise.all([
    resolveSyncedNowMs(true),
    getDoc(gameFlowRef),
    getDoc(timerRef),
  ]);

  const timer = timerSnapshot.exists() ? timerSnapshot.data() : null;
  const stillRunningForStage =
    timer?.active === true &&
    timer.stage === mapping.stage &&
    timer.purpose === "answering" &&
    timer.paused !== true &&
    typeof timer.endsAtMs === "number" &&
    timer.endsAtMs > now;

  // force = إعادة فورية حتى لو كان المؤقت ما زال يعمل (زر الميسّر الصريح).
  if (!force && stillRunningForStage) {
    return;
  }

  const durations = parseTimerDurations(gameFlowSnapshot.data()?.durations);
  const seconds = durations[mapping.durationKey];

  await setDoc(
    timerRef,
    {
      active: true,
      stage: mapping.stage,
      purpose: "answering" as const,
      durationSeconds: seconds,
      startedAtMs: now,
      endsAtMs: now + seconds * 1000,
      paused: false,
      pausedRemainingMs: 0,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}
