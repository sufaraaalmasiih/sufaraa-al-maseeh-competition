"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useCompetitionTimer } from "@/features/gameflow/use-competition-timer";
import {
  bindAudioUnlock,
  isSoundMuted,
  playCue,
  setSoundMuted,
} from "@/lib/competition-sound-cues";
import type { GameFlowStatus } from "@/types";

/**
 * يشغّل المؤثّرات الصوتية حسب المؤقّت وحالة المسابقة:
 * - تكتكة في آخر 5 ثوانٍ، وصوت عند انتهاء الوقت.
 * - فرقعة احتفال عند ظهور منصّة الفائزين.
 * تُركَّب على شاشتي الجمهور والمتسابق. تحترم كتم الصوت (لكل جهاز).
 */
export function useCompetitionSoundCues(
  status: GameFlowStatus | null | undefined,
  enabled = true,
): void {
  const { remainingSeconds, isExpired, timer } = useCompetitionTimer();
  const lastTickSecondRef = useRef<number | null>(null);
  const timeupPlayedRef = useRef(false);
  const podiumPlayedRef = useRef(false);

  useEffect(() => {
    if (enabled) {
      bindAudioUnlock();
    }
  }, [enabled]);

  const timerRunning = Boolean(enabled && timer?.active && !timer.paused);

  // تكتكة آخر 5 ثوانٍ — مرّة لكل ثانية صحيحة.
  useEffect(() => {
    if (!timerRunning) {
      lastTickSecondRef.current = null;
      return;
    }
    const second = Math.ceil(remainingSeconds);
    if (second > 5) {
      lastTickSecondRef.current = null;
      return;
    }
    if (second >= 1 && second <= 5 && lastTickSecondRef.current !== second) {
      lastTickSecondRef.current = second;
      playCue("tick");
    }
  }, [remainingSeconds, timerRunning]);

  // انتهاء الوقت — مرّة واحدة عند الانتقال إلى منتهٍ.
  useEffect(() => {
    if (timerRunning && isExpired) {
      if (!timeupPlayedRef.current) {
        timeupPlayedRef.current = true;
        playCue("timeup");
      }
    } else if (!isExpired) {
      timeupPlayedRef.current = false;
    }
  }, [isExpired, timerRunning]);

  // احتفال المنصّة — مرّة واحدة عند الدخول إلى podium.
  useEffect(() => {
    if (enabled && status === "podium") {
      if (!podiumPlayedRef.current) {
        podiumPlayedRef.current = true;
        playCue("celebrate");
      }
    } else {
      podiumPlayedRef.current = false;
    }
  }, [status, enabled]);
}

/** حالة كتم الصوت (لكل جهاز) + تبديلها. */
export function useSoundMuteToggle(): { muted: boolean; toggle: () => void } {
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    setMuted(isSoundMuted());
  }, []);

  const toggle = useCallback(() => {
    setMuted((current) => {
      const next = !current;
      setSoundMuted(next);
      return next;
    });
  }, []);

  return { muted, toggle };
}
