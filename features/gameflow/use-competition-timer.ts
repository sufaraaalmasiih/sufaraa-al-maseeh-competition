"use client";

import { useEffect, useMemo, useState } from "react";
import { useTimerStoreSnapshot } from "@/features/gameflow/timer-store";
import {
  computeRemainingSeconds,
  isTimerExpiredForSubmit,
  isTimerExpiredForUi,
} from "@/lib/competition-timer-display";
import { patchLoadingDebug } from "@/lib/loading-debug-store";
import { realLoadingDebug } from "@/lib/real-loading-debug";
import { getSyncedNowMs, syncServerClockOffset } from "@/lib/server-clock-sync";

export function useCompetitionTimer() {
  const { timer, loading, error } = useTimerStoreSnapshot();
  const [now, setNow] = useState(() => getSyncedNowMs());

  useEffect(() => {
    void syncServerClockOffset();
  }, []);

  useEffect(() => {
    if (!timer?.active) {
      return;
    }

    void syncServerClockOffset(true);
  }, [timer?.active, timer?.endsAtMs]);

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

    setNow(getSyncedNowMs());
    const intervalId = window.setInterval(() => setNow(getSyncedNowMs()), 250);

    return () => window.clearInterval(intervalId);
  }, [timer?.active, timer?.paused, timer?.endsAtMs]);

  const remainingSeconds = useMemo(
    () => computeRemainingSeconds(timer, now),
    [now, timer],
  );

  const isExpired = useMemo(() => isTimerExpiredForUi(timer, now), [now, timer]);

  const isSubmitExpired = useMemo(
    () => isTimerExpiredForSubmit(timer, now),
    [now, timer],
  );

  return { timer, loading, error, remainingSeconds, isExpired, isSubmitExpired };
}
