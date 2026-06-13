"use client";

import { onAuthStateChanged, onIdTokenChanged, type User } from "firebase/auth";
import { useCallback, useEffect, useRef, useState } from "react";
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

const ROLE_LOOKUP_TIMEOUT_MS = 8_000;
const AUTH_RESOLVE_TIMEOUT_MS = 12_000;

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

export function useAuthRole(): AuthRoleState {
  const [state, setState] = useState<AuthRoleState>({
    user: null,
    role: null,
    loading: true,
    error: null,
  });

  const resolveGenerationRef = useRef(0);
  const loadingRef = useRef(true);
  const authReadyRef = useRef(false);
  const authTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    loadingRef.current = state.loading;
  }, [state.loading]);

  const clearAuthTimeout = useCallback(() => {
    if (authTimeoutRef.current !== null) {
      window.clearTimeout(authTimeoutRef.current);
      authTimeoutRef.current = null;
    }
  }, []);

  const finishLoading = useCallback(
    (next: AuthRoleState) => {
      clearAuthTimeout();
      loadingRef.current = next.loading;
      setState(next);
      syncLoadingDebug({
        authLoading: next.loading,
        userUid: next.user?.uid ?? null,
        role: next.role,
      });
    },
    [clearAuthTimeout],
  );

  const forceAuthTimeout = useCallback(() => {
    if (!loadingRef.current) {
      return;
    }

    authHardTrace("auth resolve timeout — forcing loading false");
    authDebug("auth resolve timeout — forcing loading false");

    setState((prev) => {
      if (!prev.loading) {
        return prev;
      }

      const next: AuthRoleState = {
        user: prev.user,
        role: prev.role,
        loading: false,
        error: authTimeoutMessage(prev.user),
      };
      loadingRef.current = false;
      syncLoadingDebug({
        authLoading: false,
        userUid: next.user?.uid ?? null,
        role: next.role,
      });
      return next;
    });
    clearAuthTimeout();
  }, [clearAuthTimeout]);

  const scheduleAuthTimeout = useCallback(() => {
    clearAuthTimeout();
    authTimeoutRef.current = window.setTimeout(forceAuthTimeout, AUTH_RESOLVE_TIMEOUT_MS);
  }, [clearAuthTimeout, forceAuthTimeout]);

  useEffect(() => {
    let cancelled = false;
    let unsubscribeAuth: (() => void) | undefined;
    let unsubscribeToken: (() => void) | undefined;

    const auth = getClientFirebaseAuth();
    authHardTrace("useAuthRole useEffect START");
    authDebug("subscribing onAuthStateChanged");
    scheduleAuthTimeout();

    const resolveUser = (user: User | null, source: string) => {
      if (cancelled) {
        return;
      }

      // Firebase may emit null before IndexedDB persistence restores the session.
      // Ignore that premature null; authStateReady is the source of truth for sign-out.
      if (!authReadyRef.current && user === null) {
        authHardTrace("ignored premature null auth state", { source });
        return;
      }

      const generation = ++resolveGenerationRef.current;

      authHardTrace("auth state resolve", {
        source,
        userExists: Boolean(user),
        uid: user?.uid ?? null,
      });
      authDebug("auth state resolve", { uid: user?.uid ?? null, source });

      if (!user) {
        finishLoading({ user: null, role: null, loading: false, error: null });
        return;
      }

      finishLoading({ user, role: null, loading: true, error: null });
      scheduleAuthTimeout();

      void (async () => {
        authDebug("role lookup start", { uid: user.uid });
        authHardTrace("role lookup start", { uid: user.uid });

        try {
          const tokenResult = await withTimeout(
            user.getIdTokenResult(),
            ROLE_LOOKUP_TIMEOUT_MS,
            "getIdTokenResult",
          );
          if (generation !== resolveGenerationRef.current || cancelled) {
            return;
          }

          authDebug("token claims loaded", { uid: user.uid, claims: tokenResult.claims });

          const role = await withTimeout(
            getUserRole(user.uid),
            ROLE_LOOKUP_TIMEOUT_MS,
            "getUserRole",
          );
          if (generation !== resolveGenerationRef.current || cancelled) {
            return;
          }

          authDebug("loading false", { uid: user.uid, role });
          authHardTrace("loading false — role resolved", { uid: user.uid, role });
          finishLoading({ user, role, loading: false, error: null });
        } catch (error) {
          if (generation !== resolveGenerationRef.current || cancelled) {
            return;
          }

          authHardTraceError("role lookup failed", error);
          authDebug("loading false — role lookup error");
          finishLoading({
            user,
            role: null,
            loading: false,
            error: "تعذر تحميل صلاحيات المستخدم.",
          });
        }
      })();
    };

    void (async () => {
      try {
        await ensureAuthPersistence();
        await auth.authStateReady();
        if (cancelled) {
          return;
        }

        authReadyRef.current = true;
        authHardTrace("authStateReady resolved", {
          uid: auth.currentUser?.uid ?? null,
        });
        resolveUser(auth.currentUser, "authStateReady");
      } catch (error) {
        authHardTraceError("authStateReady failed", error);
        if (!cancelled) {
          authReadyRef.current = true;
          resolveUser(auth.currentUser, "authStateReady-fallback");
        }
      }
    })();

    try {
      unsubscribeAuth = onAuthStateChanged(auth, (user) => {
        if (user) {
          authReadyRef.current = true;
        }
        resolveUser(user, "onAuthStateChanged");
      });

      unsubscribeToken = onIdTokenChanged(auth, (user) => {
        authHardTrace("onIdTokenChanged fired", { uid: user?.uid ?? null });
      });
    } catch (error) {
      authHardTraceError("useAuthRole useEffect setup failed", error);
      finishLoading({
        user: null,
        role: null,
        loading: false,
        error: "تعذر تهيئة المصادقة.",
      });
    }

    return () => {
      authHardTrace("useAuthRole useEffect CLEANUP");
      cancelled = true;
      authReadyRef.current = false;
      resolveGenerationRef.current += 1;
      clearAuthTimeout();
      unsubscribeAuth?.();
      unsubscribeToken?.();
    };
  }, [clearAuthTimeout, finishLoading, scheduleAuthTimeout]);

  return state;
}
