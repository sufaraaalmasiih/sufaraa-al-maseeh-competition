"use client";

import { useEffect, useState } from "react";
import { AUDIENCE_RESULTS_COUNTDOWN_SECONDS } from "@/features/audience/audience-results-countdown";

interface AudienceResultsCountdownState {
  remaining: number;
  resultsReady: boolean;
  progress: number;
}

export function useAudienceResultsCountdown(
  resetKey: string,
  seconds: number = AUDIENCE_RESULTS_COUNTDOWN_SECONDS,
): AudienceResultsCountdownState {
  const [remaining, setRemaining] = useState(seconds);
  const [resultsReady, setResultsReady] = useState(false);

  useEffect(() => {
    setResultsReady(false);
    setRemaining(seconds);

    let current = seconds;
    const intervalId = window.setInterval(() => {
      current -= 1;
      if (current <= 0) {
        window.clearInterval(intervalId);
        setRemaining(0);
        setResultsReady(true);
        return;
      }
      setRemaining(current);
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [resetKey, seconds]);

  const progress =
    seconds <= 0 ? 1 : Math.min(1, Math.max(0, (seconds - remaining) / seconds));

  return { remaining, resultsReady, progress };
}
