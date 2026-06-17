"use client";

import { useEffect, useState } from "react";
import { getDocs, type QuerySnapshot } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { ensureAuthPersistence, getClientFirebaseAuth } from "@/firebase/firebaseClient";
import { teamStatesCollectionRef } from "@/firebase/firestore";
import { subscribeFirestoreQuery } from "@/lib/firestore-listener";

export interface TeamStateRecord {
  id: string;
  data: Record<string, unknown>;
}

interface TeamStatesStoreEntry {
  docs: TeamStateRecord[];
  loading: boolean;
  error: string | null;
}

const DEFAULT_ERROR = "تعذر تحميل النتائج النهائية.";

const stores = new Map<string, TeamStatesStoreEntry>();
const listeners = new Map<string, Set<() => void>>();
const unsubscribeFns = new Map<string, () => void>();
const retryTimers = new Map<string, number>();
const retryCounts = new Map<string, number>();

function getStore(competitionId: string): TeamStatesStoreEntry {
  const existing = stores.get(competitionId);
  if (existing) {
    return existing;
  }

  const created: TeamStatesStoreEntry = {
    docs: [],
    loading: true,
    error: null,
  };
  stores.set(competitionId, created);
  return created;
}

function notify(competitionId: string): void {
  listeners.get(competitionId)?.forEach((listener) => listener());
}

function setStore(
  competitionId: string,
  partial: Partial<TeamStatesStoreEntry>,
): void {
  const current = getStore(competitionId);
  stores.set(competitionId, { ...current, ...partial });
  notify(competitionId);
}

function mapSnapshot(snapshot: QuerySnapshot): TeamStateRecord[] {
  return snapshot.docs.map((item) => ({
    id: item.id,
    data: item.data() as Record<string, unknown>,
  }));
}

function clearRetry(competitionId: string): void {
  const timerId = retryTimers.get(competitionId);
  if (timerId !== undefined) {
    window.clearTimeout(timerId);
    retryTimers.delete(competitionId);
  }
}

function stopSubscription(competitionId: string): void {
  clearRetry(competitionId);
  unsubscribeFns.get(competitionId)?.();
  unsubscribeFns.delete(competitionId);
}

async function fetchTeamStatesOnce(competitionId: string): Promise<boolean> {
  try {
    const snapshot = await getDocs(teamStatesCollectionRef(competitionId));
    setStore(competitionId, {
      docs: mapSnapshot(snapshot),
      loading: false,
      error: null,
    });
    return true;
  } catch {
    return false;
  }
}

function scheduleRetry(competitionId: string, attempt: number): void {
  clearRetry(competitionId);

  const delayMs = Math.min(300 * attempt, 2_000);
  const timerId = window.setTimeout(() => {
    retryTimers.delete(competitionId);

    if ((listeners.get(competitionId)?.size ?? 0) === 0) {
      return;
    }

    startTeamStatesSubscription(competitionId);
  }, delayMs);

  retryTimers.set(competitionId, timerId);
}

function handleSubscriptionError(competitionId: string, attempt: number): void {
  if (attempt >= 6) {
    void fetchTeamStatesOnce(competitionId).then((recovered) => {
      if (!recovered) {
        setStore(competitionId, {
          loading: false,
          error: DEFAULT_ERROR,
        });
      } else {
        startTeamStatesSubscription(competitionId);
      }
    });
    return;
  }

  retryCounts.set(competitionId, attempt);
  setStore(competitionId, {
    loading: true,
    error: null,
  });

  const auth = getClientFirebaseAuth();
  const unsubscribeAuth = onAuthStateChanged(auth, () => {
    unsubscribeAuth();
    scheduleRetry(competitionId, attempt);
  });
}

function startTeamStatesSubscription(competitionId: string): void {
  stopSubscription(competitionId);

  const attempt = (retryCounts.get(competitionId) ?? 0) + 1;
  retryCounts.set(competitionId, attempt);

  const unsubscribe = subscribeFirestoreQuery(
    teamStatesCollectionRef(competitionId),
    (snapshot) => {
      retryCounts.set(competitionId, 0);
      setStore(competitionId, {
        docs: mapSnapshot(snapshot),
        loading: false,
        error: null,
      });
    },
    () => {
      stopSubscription(competitionId);
      handleSubscriptionError(competitionId, attempt);
    },
  );

  unsubscribeFns.set(competitionId, unsubscribe);
}

function ensureTeamStatesSubscription(competitionId: string): void {
  if (unsubscribeFns.has(competitionId) || retryTimers.has(competitionId)) {
    return;
  }

  setStore(competitionId, {
    docs: getStore(competitionId).docs,
    loading: true,
    error: null,
  });

  void ensureAuthPersistence()
    .catch(() => undefined)
    .finally(() => {
      startTeamStatesSubscription(competitionId);
    });
}

export function refreshTeamStatesSubscription(competitionId = "main"): void {
  retryCounts.set(competitionId, 0);
  stopSubscription(competitionId);

  if ((listeners.get(competitionId)?.size ?? 0) === 0) {
    return;
  }

  void ensureAuthPersistence()
    .catch(() => undefined)
    .finally(() => {
      startTeamStatesSubscription(competitionId);
    });
}

export function subscribeTeamStates(
  competitionId: string,
  listener: () => void,
): () => void {
  const storeListeners = listeners.get(competitionId) ?? new Set<() => void>();
  storeListeners.add(listener);
  listeners.set(competitionId, storeListeners);
  ensureTeamStatesSubscription(competitionId);
  listener();

  return () => {
    const currentListeners = listeners.get(competitionId);
    if (!currentListeners) {
      return;
    }

    currentListeners.delete(listener);
    if (currentListeners.size === 0) {
      listeners.delete(competitionId);
      stopSubscription(competitionId);
    }
  };
}

export function getTeamStatesSnapshot(competitionId: string): TeamStatesStoreEntry {
  return getStore(competitionId);
}

export function useTeamStatesSnapshot(
  competitionId = "main",
  enabled = true,
): TeamStatesStoreEntry {
  const [, setVersion] = useState(0);

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    return subscribeTeamStates(competitionId, () => {
      setVersion((value) => value + 1);
    });
  }, [competitionId, enabled]);

  if (!enabled) {
    return { docs: [], loading: false, error: null };
  }

  return getTeamStatesSnapshot(competitionId);
}
