"use client";

import { onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";
import { gameFlowRef } from "@/firebase/firestore";
import {
  DEFAULT_TIMER_DURATIONS,
  parseTimerDurations,
  type FacilitatorTimerDurations,
} from "@/features/facilitator/facilitator-timer-settings";

/** Live timer durations from gameFlow.durations — shared by all screens. */
export function useTimerDurations(): FacilitatorTimerDurations {
  const [durations, setDurations] = useState<FacilitatorTimerDurations>(
    () => ({ ...DEFAULT_TIMER_DURATIONS }),
  );

  useEffect(() => {
    return onSnapshot(gameFlowRef, (snapshot) => {
      setDurations(parseTimerDurations(snapshot.data()?.durations));
    });
  }, []);

  return durations;
}
