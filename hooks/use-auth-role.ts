"use client";

import { onAuthStateChanged, type User } from "firebase/auth";
import { useEffect, useSyncExternalStore } from "react";
import { getClientFirebaseAuth, ensureAuthPersistence } from "@/firebase/firebaseClient";
import { getUserRole } from "@/firebase/get-user-role";
import { authDebug } from "@/lib/auth-debug";
import { isLoadingDebugPanelEnabled } from "@/lib/debug-flags";
import { authHardTrace, authHardTraceError } from "@/lib/auth-hard-trace";
import { patchLoadingDebug } from "@/lib/loading-debug-store";
import type { AppRole } from "@/types";

interface AuthRoleState {
  user: User | null;
  role: AppRole | null;
  loading: boolean;
  error: string | null;
}

const ROLE_LOOKUP_TIMEOUT_MS = 5_000;
const AUTH_FAILSAFE_MS = 4_000;
const AUTH_BOOTSTRAP_TIMEOUT_MS = 3_000;
const LOOKUP_WATCHDOG_MS = 6_000;

const SERVER_SNAPSHOT: AuthRoleState = {
  user: null,
  role: null,
  loading: true,
  error: null,
};

type ResolvedAuthCache = {
  uid: string;
  role: AppRole | null;
};

let resolvedAuthCache: ResolvedAuthCache | null = null;
let authStore: AuthRoleState = { ...SERVER_SNAPSHOT };
let authListeners = new Set<() => void>();
let authListenerStarted = false;
let failsafeTimerId: number | undefined;
let lookupUid: string | null = null;
let lookupWatchdogId: number | undefined;
let failsafeArmed = false;
let bootstrapDone = false;

function syncLoadingDebug(partial: Parameters<typeof patchLoadingDebug>[0]): void {
  if (isLoadingDebugPanelEnabled()) {
    patchLoadingDebug(partial);
  }
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      window.setTimeout(() => {
        reject(new Error(`${label} timed out after ${ms}ms`));
      }, ms);
    }),
  ]);
}

function authTimeoutMessage(user: User | null): string {
  if (user) {
    return "تعذر تحميل صلاحيات المستخدم خلال المهلة المحددة. يرجى إعادة تسجيل الدخول.";
  }

  return "تعذر الاتصال بخدمة المصادقة. يرجى إعادة تحميل الصفحة أو تسجيل الدخول.";
}

function publish(next: AuthRoleState): void {
  authStore = next;
  syncLoadingDebug({
    authLoading: next.loading,
    userUid: next.user?.uid ?? null,
    role: next.role,
  });
  authListeners.forEach((listener) => listener());
}

function clearLookupWatchdog(): void {
  if (lookupWatchdogId !== undefined) {
    window.clearTimeout(lookupWatchdogId);
    lookupWatchdogId = undefined;
  }
}

function scheduleLookupWatchdog(uid: string): void {
  clearLookupWatchdog();

  lookupWatchdogId = window.setTimeout(() => {
    lookupWatchdogId = undefined;

    if (lookupUid !== uid || !authStore.loading) {
      return;
    }

    authHardTrace("role lookup watchdog — forcing loading false", { uid });
    finishResolved({
      user: getClientFirebaseAuth().currentUser,
      role: resolvedAuthCache?.uid === uid ? resolvedAuthCache.role : null,
      loading: false,
      error: "تعذر تحميل صلاحيات المستخدم خلال المهلة المحددة.",
    });
  }, LOOKUP_WATCHDOG_MS);
}

function clearFailsafe(): void {
  failsafeArmed = false;
  if (failsafeTimerId !== undefined) {
    window.clearTimeout(failsafeTimerId);
    failsafeTimerId = undefined;
  }
}

function scheduleFailsafe(): void {
  if (failsafeArmed || !authStore.loading) {
    return;
  }

  // clearFailsafe() resets failsafeArmed, so arm AFTER clearing — otherwise the
  // re-entrancy guard above is dead and every call reschedules the failsafe.
  clearFailsafe();
  failsafeArmed = true;

  failsafeTimerId = window.setTimeout(() => {
    failsafeTimerId = undefined;
    failsafeArmed = false;

    if (!authStore.loading) {
      return;
    }

    const auth = getClientFirebaseAuth();
    const user = auth.currentUser;

    authHardTrace("auth failsafe timeout — forcing loading false");
    authDebug("auth failsafe timeout — forcing loading false");

    publish({
      user,
      role: user && resolvedAuthCache?.uid === user.uid ? resolvedAuthCache.role : null,
      loading: false,
      error: authTimeoutMessage(user),
    });
  }, AUTH_FAILSAFE_MS);
}

function finishResolved(next: AuthRoleState): void {
  // Only cache a *successful, non-null* role. Caching a null/errored result
  // (e.g. a role lookup that timed out, or that raced ahead of a freshly
  // written teams/{uid} doc during registration) used to poison the session:
  // every later auth tick hit the cache and kept role=null, which surfaces as
  // "ليست لديك صلاحية" right after registration (#5) or a phantom logout for a
  // staff tab after a transient network blip (#6). Keeping only last-known-good
  // means the watchdog/failsafe fall back to a real role instead of nuking it.
  if (!next.loading && next.user && next.role && !next.error) {
    resolvedAuthCache = { uid: next.user.uid, role: next.role };
  }

  if (!next.loading && !next.user) {
    resolvedAuthCache = null;
  }

  lookupUid = null;
  clearLookupWatchdog();
  publish(next);

  if (!next.loading) {
    clearFailsafe();
  }
}

async function resolveSignedInUser(user: User, source: string): Promise<void> {
  if (resolvedAuthCache?.uid === user.uid) {
    authDebug("role lookup skipped — cache hit", { uid: user.uid, source });
    finishResolved({ user, role: resolvedAuthCache.role, loading: false, error: null });
    return;
  }

  if (lookupUid === user.uid) {
    authDebug("role lookup skipped — already in flight", { uid: user.uid, source });
    return;
  }

  lookupUid = user.uid;
  scheduleLookupWatchdog(user.uid);
  authDebug("role lookup start", { uid: user.uid, source });
  authHardTrace("role lookup start", { uid: user.uid, source });

  try {
    const role = await lookupRoleWithRetry(user.uid);

    if (lookupUid !== user.uid) {
      return;
    }

    authDebug("loading false", { uid: user.uid, role });
    authHardTrace("loading false — role resolved", { uid: user.uid, role });
    finishResolved({ user, role, loading: false, error: null });
  } catch (error) {
    if (lookupUid !== user.uid) {
      return;
    }

    authHardTraceError("role lookup failed", error);
    // Keep the last-known-good role for this uid (if any) instead of forcing
    // null — a transient timeout must not eject an already-authorized user.
    const fallbackRole = resolvedAuthCache?.uid === user.uid ? resolvedAuthCache.role : null;
    finishResolved({
      user,
      role: fallbackRole,
      loading: false,
      error: fallbackRole ? null : "تعذر تحميل صلاحيات المستخدم.",
    });
  }
}

const ROLE_LOOKUP_RETRIES = 2;

async function lookupRoleWithRetry(uid: string): Promise<AppRole | null> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= ROLE_LOOKUP_RETRIES; attempt += 1) {
    try {
      return await withTimeout(getUserRole(uid), ROLE_LOOKUP_TIMEOUT_MS, "getUserRole");
    } catch (error) {
      lastError = error;
      if (lookupUid !== uid) {
        throw error;
      }
    }
  }
  throw lastError;
}

/**
 * Seed the resolved role immediately after a successful registration or login,
 * when the role is already known from the write we just performed. This avoids
 * the AuthGate race where getUserRole reads teams/{uid} before that doc has
 * propagated and the user lands on "ليست لديك صلاحية" (#5).
 */
export function primeAuthRole(uid: string, role: AppRole): void {
  resolvedAuthCache = { uid, role };
  const auth = getClientFirebaseAuth();
  const user = auth.currentUser;
  // Cancel any in-flight lookup for this uid so it cannot overwrite the primed
  // role with a stale null result.
  if (lookupUid === uid) {
    lookupUid = null;
    clearLookupWatchdog();
  }
  finishResolved({
    user: user && user.uid === uid ? user : auth.currentUser,
    role,
    loading: false,
    error: null,
  });
}

function handleAuthUser(user: User | null, source: string): void {
  authHardTrace("auth state resolve", {
    source,
    userExists: Boolean(user),
    uid: user?.uid ?? null,
  });

  if (!user) {
    finishResolved({ user: null, role: null, loading: false, error: null });
    return;
  }

  void resolveSignedInUser(user, source);
}

function bootstrapAuthState(source: string): void {
  if (bootstrapDone) {
    return;
  }
  bootstrapDone = true;

  const auth = getClientFirebaseAuth();

  if (auth.currentUser) {
    handleAuthUser(auth.currentUser, `${source}:currentUser`);
    return;
  }

  void Promise.race([
    auth.authStateReady(),
    new Promise<never>((_, reject) => {
      window.setTimeout(() => {
        reject(new Error(`authStateReady timed out after ${AUTH_BOOTSTRAP_TIMEOUT_MS}ms`));
      }, AUTH_BOOTSTRAP_TIMEOUT_MS);
    }),
  ])
    .then(() => {
      handleAuthUser(auth.currentUser, `${source}:authStateReady`);
    })
    .catch((error) => {
      authHardTraceError("auth bootstrap timeout", error);
      handleAuthUser(auth.currentUser, `${source}:authStateReady-timeout`);
    });
}

function ensureLoadingFailsafe(): void {
  if (!authStore.loading) {
    return;
  }

  scheduleFailsafe();
  bootstrapAuthState("ensureLoadingFailsafe");
}

function startAuthListener(): void {
  if (typeof window === "undefined") {
    return;
  }

  if (authListenerStarted) {
    ensureLoadingFailsafe();
    return;
  }

  authListenerStarted = true;
  (window as Window & { __authRoleBuild?: string }).__authRoleBuild = "singleton-v4";
  authHardTrace("auth listener START");

  publish({ ...authStore, loading: true, error: null });
  ensureLoadingFailsafe();

  const auth = getClientFirebaseAuth();

  void ensureAuthPersistence().catch((error) => {
    authHardTraceError("ensureAuthPersistence failed", error);
  });

  onAuthStateChanged(auth, (user) => {
    handleAuthUser(user, "onAuthStateChanged");
  });
}

function subscribeAuthStore(listener: () => void): () => void {
  startAuthListener();
  authListeners.add(listener);
  return () => {
    authListeners.delete(listener);
  };
}

function getAuthStoreSnapshot(): AuthRoleState {
  return authStore;
}

function getAuthStoreServerSnapshot(): AuthRoleState {
  return SERVER_SNAPSHOT;
}

export function useAuthRole(): AuthRoleState {
  const state = useSyncExternalStore(
    subscribeAuthStore,
    getAuthStoreSnapshot,
    getAuthStoreServerSnapshot,
  );

  useEffect(() => {
    startAuthListener();

    return () => {
      // Keep the singleton listener alive for the app session.
    };
  }, []);

  return state;
}
