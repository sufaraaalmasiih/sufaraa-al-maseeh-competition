"use client";

import type { ReactNode } from "react";
import { AudienceResultsCountdown } from "@/features/audience/components/audience-results-countdown";
import {
  AUDIENCE_RESULTS_COUNTDOWN_SECONDS,
} from "@/features/audience/audience-results-countdown";
import { useAudienceResultsCountdown } from "@/features/audience/use-audience-results-countdown";

interface AudienceStageResultsGateProps {
  resetKey: string;
  eyebrow?: string;
  countdownTitle?: string;
  countdownSubtitle?: string;
  seconds?: number;
  children: (resultsReady: boolean) => ReactNode;
}

export function AudienceStageResultsGate({
  resetKey,
  eyebrow,
  countdownTitle,
  countdownSubtitle,
  seconds = AUDIENCE_RESULTS_COUNTDOWN_SECONDS,
  children,
}: AudienceStageResultsGateProps) {
  const { remaining, resultsReady, progress } = useAudienceResultsCountdown(resetKey, seconds);

  if (!resultsReady) {
    return (
      <AudienceResultsCountdown
        remaining={remaining}
        progress={progress}
        eyebrow={eyebrow}
        title={countdownTitle}
        subtitle={countdownSubtitle}
      />
    );
  }

  return <>{children(true)}</>;
}
