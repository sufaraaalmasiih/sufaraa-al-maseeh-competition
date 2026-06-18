"use client";

import { getDoc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { gameFlowRef, timerRef } from "@/firebase/firestore";
import {
  readActiveSessionId,
  saveActiveSessionResults,
} from "@/features/facilitator/competition-session";
import { startStage2ReadingTimerDoc } from "@/features/gameflow/stage2-reading-timer";
import { startStage2AnsweringTimerDoc } from "@/features/gameflow/stage2-answering-timer";
import { fetchTimerDurations } from "@/features/facilitator/facilitator-timer-settings";
import {
  prepareStage1QuestionSession,
  prepareStage2QuestionSession,
} from "@/features/facilitator/prepare-stage-question-session";
import { fetchFinalResultTeams } from "@/features/facilitator/use-final-results";
import { getSyncedNowMs, resolveSyncedNowMs } from "@/lib/server-clock-sync";
import type { GameFlowStatus } from "@/types";

async function stopTimerDoc() {
  await setDoc(
    timerRef,
    { active: false, paused: false, pausedRemainingMs: 0, updatedAt: serverTimestamp() },
    { merge: true },
  );
}

async function startStage1TimerDoc(seconds: number, now = getSyncedNowMs()) {
  await setDoc(
    timerRef,
    {
      active: true,
      stage: "stage1",
      purpose: "answering",
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

/**
 * Central GameFlow transition. Applies documented side effects:
 * - entering stage2_reading auto-starts the reading timer
 * - entering stage2_player_turns auto-starts the field answering timer
 * - entering stage3_board clears the active question
 */
export async function setGameFlowStatus(
  nextStatus: GameFlowStatus,
  nextStage: string,
): Promise<void> {
  const payload: Record<string, unknown> = {
    status: nextStatus,
    currentStage: nextStage,
  };

  if (nextStatus === "stage3_board") {
    payload.stage3ActiveQuestion = null;
  }

  if (nextStatus === "competition_intro") {
    const sessionId = await readActiveSessionId();
    if (!sessionId) {
      throw new Error("أنشئ سجل المسابقة أولاً عبر «بدء مقدمة المسابقة».");
    }
  }

  const writes: Promise<unknown>[] = [updateDoc(gameFlowRef, payload)];

  if (nextStatus === "stage1_running" || nextStatus === "stage2_reading") {
    const durations = await fetchTimerDurations();
    const syncedNow = await resolveSyncedNowMs(true);
    if (nextStatus === "stage1_running") {
      await prepareStage1QuestionSession();
      writes.push(startStage1TimerDoc(durations.stage1, syncedNow));
    } else {
      await prepareStage2QuestionSession();
      writes.push(startStage2ReadingTimerDoc(durations.stage2Reading, syncedNow));
    }
  } else if (nextStatus === "stage2_player_turns") {
    const durations = await fetchTimerDurations();
    const syncedNow = await resolveSyncedNowMs(true);
    writes.push(startStage2AnsweringTimerDoc(durations.stage2Turn, syncedNow));
  }

  await Promise.all(writes);

  if (nextStatus === "podium") {
    const sessionId = await readActiveSessionId();
    if (sessionId) {
      try {
        const teams = await fetchFinalResultTeams();
        if (teams.length > 0) {
          await saveActiveSessionResults(teams, "auto");
        }
      } catch {
        // Auto-save must not block podium transition.
      }
    }
  }
}

export async function finishStage(
  stageNumber: 1 | 2 | 3 | 4,
): Promise<void> {
  const status = `stage${stageNumber}_finished` as GameFlowStatus;
  const payload: Record<string, unknown> = {
    status,
    currentStage: `stage${stageNumber}`,
  };

  if (stageNumber === 3) {
    payload.stage3ActiveQuestion = null;
  }

  if (stageNumber === 4) {
    payload.stage4ActiveQuestion = null;
  }

  await Promise.all([updateDoc(gameFlowRef, payload), stopTimerDoc()]);
}

export async function startStage1Timer(now?: number): Promise<void> {
  const durations = await fetchTimerDurations();
  const syncedNow = now ?? (await resolveSyncedNowMs(true));
  await startStage1TimerDoc(durations.stage1, syncedNow);
}

export async function startStage2ReadingTimer(): Promise<void> {
  const durations = await fetchTimerDurations();
  const syncedNow = await resolveSyncedNowMs(true);
  await startStage2ReadingTimerDoc(durations.stage2Reading, syncedNow);
}

export async function startStage2AnsweringTimer(): Promise<void> {
  const durations = await fetchTimerDurations();
  const syncedNow = await resolveSyncedNowMs(true);
  await startStage2AnsweringTimerDoc(durations.stage2Turn, syncedNow);
}

export async function stopTimer(): Promise<void> {
  await stopTimerDoc();
}

/**
 * Freeze the running timer at its current remaining time. All screens read the
 * timer doc, so the countdown halts everywhere and auto-advance handlers idle.
 */
export async function pauseTimer(): Promise<void> {
  const now = await resolveSyncedNowMs(true);
  const snapshot = await getDoc(timerRef);
  const timer = snapshot.data();

  if (!timer || timer.active !== true || timer.paused === true) {
    return;
  }

  const endsAtMs = typeof timer.endsAtMs === "number" ? timer.endsAtMs : now;
  const remainingMs = Math.max(0, endsAtMs - now);

  await setDoc(
    timerRef,
    { paused: true, pausedRemainingMs: remainingMs, updatedAt: serverTimestamp() },
    { merge: true },
  );
}

/** Resume a paused timer: recompute the end time from the frozen remaining ms. */
export async function resumeTimer(): Promise<void> {
  const now = await resolveSyncedNowMs(true);
  const snapshot = await getDoc(timerRef);
  const timer = snapshot.data();

  if (!timer || timer.paused !== true) {
    return;
  }

  const remainingMs =
    typeof timer.pausedRemainingMs === "number" ? timer.pausedRemainingMs : 0;

  await setDoc(
    timerRef,
    {
      paused: false,
      pausedRemainingMs: 0,
      startedAtMs: now,
      endsAtMs: now + remainingMs,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

/** Freeze competition: pause timer + show banner on all screens. */
export async function freezeCompetition(): Promise<void> {
  await Promise.all([
    updateDoc(gameFlowRef, { competitionFrozen: true }),
    pauseTimer(),
  ]);
}

/** Resume competition after facilitator unfreezes. */
export async function unfreezeCompetition(): Promise<void> {
  const snapshot = await getDoc(timerRef);
  const timer = snapshot.data();
  const wasPaused = timer?.paused === true;

  await updateDoc(gameFlowRef, { competitionFrozen: false });

  if (wasPaused) {
    await resumeTimer();
  }
}

export async function resetTimer(): Promise<void> {
  const now = await resolveSyncedNowMs(true);
  const snapshot = await getDoc(timerRef);
  const timer = snapshot.data();

  if (!timer || timer.active !== true) {
    return;
  }

  const durationSeconds =
    typeof timer.durationSeconds === "number" && timer.durationSeconds > 0
      ? timer.durationSeconds
      : 0;

  if (durationSeconds <= 0) {
    return;
  }

  await setDoc(
    timerRef,
    {
      paused: false,
      pausedRemainingMs: 0,
      startedAtMs: now,
      endsAtMs: now + durationSeconds * 1000,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}
