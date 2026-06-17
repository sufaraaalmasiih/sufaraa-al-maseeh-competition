"use client";

import { useEffect, useMemo, useState } from "react";
import { useTimerStoreSnapshot } from "@/features/gameflow/timer-store";
import { patchLoadingDebug } from "@/lib/loading-debug-store";
import { realLoadingDebug } from "@/lib/real-loading-debug";

export function useCompetitionTimer() {
  const { timer, loading, error } = useTimerStoreSnapshot();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    patchLoadingDebug({ timerLoading: loading });
    if (!loading) {
      realLoadingDebug("useCompetitionTimer", "loading false reached", {
        active: timer?.active ?? false,
      });
    }
  }, [loading, timer?.active]);

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

    if (timer.paused) {
      return Math.max(0, Math.ceil((timer.pausedRemainingMs ?? 0) / 1000));
    }

    if (!timer.endsAtMs) {
      return 0;
    }

    return Math.max(0, Math.ceil((timer.endsAtMs - now) / 1000));
  }, [now, timer]);

  const isExpired = Boolean(timer?.active && !timer.paused && remainingSeconds <= 0);

  return { timer, loading, error, remainingSeconds, isExpired };
}
