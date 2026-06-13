"use client";

import { onSnapshot } from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import { timerRef } from "@/firebase/firestore";
import { patchLoadingDebug } from "@/lib/loading-debug-store";
import { realLoadingDebug } from "@/lib/real-loading-debug";
import type { CompetitionTimer } from "@/types";

const LISTENER_PATH = "competitions/main/system/timer";

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

export function useCompetitionTimer() {
  const [timer, setTimer] = useState<CompetitionTimer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    realLoadingDebug("useCompetitionTimer", "subscribing listener", {
      listenerPath: LISTENER_PATH,
    });
    patchLoadingDebug({ timerLoading: true });

    const unsubscribe = onSnapshot(
      timerRef,
      (snapshot) => {
        const timerState = snapshot.exists() ? normalizeTimer(snapshot.data()) : null;
        realLoadingDebug("useCompetitionTimer", "snapshot received", {
          listenerPath: LISTENER_PATH,
          snapshotReceived: true,
          exists: snapshot.exists(),
          timer: timerState,
        });
        setTimer(timerState);
        setError(null);
        setLoading(false);
        patchLoadingDebug({ timerLoading: false });
        realLoadingDebug("useCompetitionTimer", "loading false reached", {
          active: timerState?.active ?? false,
        });
      },
      (listenerError) => {
        setError("تعذر تحميل مؤقت المسابقة.");
        setLoading(false);
        patchLoadingDebug({ timerLoading: false });
        realLoadingDebug("useCompetitionTimer", "loading false reached (listener error)", {
          listenerPath: LISTENER_PATH,
          snapshotReceived: false,
          error: listenerError instanceof Error ? listenerError.message : String(listenerError),
        });
      },
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!timer?.active || timer.paused) {
      return undefined;
    }

    setNow(Date.now());
    const intervalId = window.setInterval(() => setNow(Date.now()), 1000);

    return () => window.clearInterval(intervalId);
  }, [timer?.active, timer?.paused, timer?.endsAtMs]);

  const remainingSeconds = useMemo(() => {
    if (!timer?.active) {
      return 0;
    }

    // While paused the countdown is frozen at the stored remaining time.
    if (timer.paused) {
      return Math.max(0, Math.ceil((timer.pausedRemainingMs ?? 0) / 1000));
    }

    if (!timer.endsAtMs) {
      return 0;
    }

    return Math.max(0, Math.ceil((timer.endsAtMs - now) / 1000));
  }, [now, timer]);

  // A paused timer never reports as expired, so auto-advance handlers stay idle.
  const isExpired = Boolean(timer?.active && !timer.paused && remainingSeconds <= 0);

  return {
    timer,
    loading,
    error,
    remainingSeconds,
    isExpired,
  };
}
