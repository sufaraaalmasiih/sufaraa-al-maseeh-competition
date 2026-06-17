"use client";

import { useEffect, useSyncExternalStore } from "react";
import { timerRef } from "@/firebase/firestore";
import { subscribeFirestoreDoc } from "@/lib/firestore-listener";
import type { CompetitionTimer } from "@/types";

const LISTENER_PATH = "competitions/main/system/timer";

interface TimerStoreState {
  timer: CompetitionTimer | null;
  loading: boolean;
  error: string | null;
}

function normalizeTimer(data: Partial<CompetitionTimer>): CompetitionTimer {
  const stage =
    data.stage === "stage1" ||
    data.stage === "stage2" ||
    data.stage === "stage3" ||
    data.stage === "stage4"
      ? data.stage
      : "none";

  const purpose =
    data.purpose === "answering" ||
    data.purpose === "reading" ||
    data.purpose === "selection" ||
    data.purpose === "reveal"
      ? data.purpose
      : "none";

  return {
    active: Boolean(data.active),
    stage,
    purpose,
    durationSeconds:
      typeof data.durationSeconds === "number" ? data.durationSeconds : 0,
    startedAtMs: typeof data.startedAtMs === "number" ? data.startedAtMs : 0,
    endsAtMs: typeof data.endsAtMs === "number" ? data.endsAtMs : 0,
    paused: Boolean(data.paused),
    pausedRemainingMs:
      typeof data.pausedRemainingMs === "number" ? data.pausedRemainingMs : 0,
    controlledBy: data.controlledBy,
    controlledByName: data.controlledByName,
    updatedAt: data.updatedAt,
  } as CompetitionTimer;
}

const SERVER_SNAPSHOT: TimerStoreState = {
  timer: null,
  loading: true,
  error: null,
};

let timerStore: TimerStoreState = { ...SERVER_SNAPSHOT };
const timerListeners = new Set<() => void>();
let unsubscribeSnapshot: (() => void) | null = null;
let listenerStarted = false;

function notify(): void {
  timerListeners.forEach((listener) => listener());
}

function setTimerStore(partial: Partial<TimerStoreState>): void {
  timerStore = { ...timerStore, ...partial };
  notify();
}

function startTimerListener(): void {
  if (listenerStarted) {
    return;
  }
  listenerStarted = true;

  unsubscribeSnapshot = subscribeFirestoreDoc(
    timerRef,
    (snapshot) => {
      setTimerStore({
        timer: snapshot.exists() ? normalizeTimer(snapshot.data()) : null,
        loading: false,
        error: null,
      });
    },
    () => {
      setTimerStore({
        loading: false,
        error: "تعذر تحميل مؤقت المسابقة.",
      });
    },
  );
}

function subscribeTimerStore(listener: () => void): () => void {
  startTimerListener();
  timerListeners.add(listener);
  return () => {
    timerListeners.delete(listener);
  };
}

function getTimerStoreSnapshot(): TimerStoreState {
  return timerStore;
}

function getTimerStoreServerSnapshot(): TimerStoreState {
  return SERVER_SNAPSHOT;
}

export function useTimerStoreSnapshot(): TimerStoreState {
  const state = useSyncExternalStore(
    subscribeTimerStore,
    getTimerStoreSnapshot,
    getTimerStoreServerSnapshot,
  );

  useEffect(() => {
    startTimerListener();
  }, []);

  return state;
}

export { LISTENER_PATH as TIMER_LISTENER_PATH };
