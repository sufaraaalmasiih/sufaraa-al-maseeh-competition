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

const STAGE_INTRO_STATUSES: GameFlowStatus[] = [
  "competition_intro",
  "stage1_intro",
  "stage2_intro",
  "stage3_intro",
  "stage4_intro",
];

const REVEAL_STATUSES: GameFlowStatus[] = ["stage3_reveal", "stage4_reveal"];

/**
 * يشغّل المؤثّرات الصوتية حسب المؤقّت وحالة المسابقة:
 * - تكتكة في آخر 5 ثوانٍ (أكثر إلحاحاً في آخر 3)، وصوت عند انتهاء الوقت.
 * - إعلان، طبل، تشويق، مقدمة مرحلة، نتائج نهائية، منصّة.
 * - صوت عند قبول اعتراض (عبر مفتاح الإعلان من gameFlow).
 */
export function useCompetitionSoundCues(
  status: GameFlowStatus | null | undefined,
  enabled = true,
  objectionNoticeKey: string | null = null,
): void {
  const { remainingSeconds, isExpired, timer } = useCompetitionTimer();
  const lastTickSecondRef = useRef<number | null>(null);
  const timeupPlayedRef = useRef(false);
  const podiumPlayedRef = useRef(false);
  const finalResultsPlayedRef = useRef(false);
  const revealPlayedRef = useRef<string | null>(null);
  const stageIntroPlayedRef = useRef<string | null>(null);
  const objectionPlayedRef = useRef<string | null>(null);
  const prevStatusRef = useRef<GameFlowStatus | null>(null);

  useEffect(() => {
    if (enabled) {
      bindAudioUnlock();
    }
  }, [enabled]);

  const timerRunning = Boolean(enabled && timer?.active && !timer.paused);

  // تكتكة آخر 5 ثوانٍ — مرّة لكل ثانية؛ آخر 3 ثوانٍ أكثر إلحاحاً.
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
      playCue(second <= 3 ? "tick_urgent" : "tick");
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

  // مقدمات المراحل — swoosh خفيف عند الدخول.
  useEffect(() => {
    if (!enabled || !status) {
      return;
    }
    if (STAGE_INTRO_STATUSES.includes(status) && stageIntroPlayedRef.current !== status) {
      stageIntroPlayedRef.current = status;
      playCue("swoosh");
      window.setTimeout(() => playCue("stage_intro"), 120);
    }
    if (!STAGE_INTRO_STATUSES.includes(status)) {
      stageIntroPlayedRef.current = null;
    }
  }, [status, enabled]);

  // إعلان الإجابات — reveal + suspense عند الدخول لمرحلة الإعلان.
  useEffect(() => {
    if (!enabled || !status) {
      return;
    }
    if (REVEAL_STATUSES.includes(status) && revealPlayedRef.current !== status) {
      revealPlayedRef.current = status;
      playCue("suspense");
      window.setTimeout(() => playCue("reveal"), 400);
    }
    if (!REVEAL_STATUSES.includes(status)) {
      revealPlayedRef.current = null;
    }
  }, [status, enabled]);

  // النتائج النهائية — fanfare عند أول دخول.
  useEffect(() => {
    if (enabled && status === "final_results") {
      if (!finalResultsPlayedRef.current) {
        finalResultsPlayedRef.current = true;
        playCue("fanfare");
      }
    } else {
      finalResultsPlayedRef.current = false;
    }
  }, [status, enabled]);

  // منصّة الفائزين — احتفال موسّع.
  useEffect(() => {
    if (enabled && status === "podium") {
      if (!podiumPlayedRef.current) {
        podiumPlayedRef.current = true;
        playCue("podium");
      }
    } else {
      podiumPlayedRef.current = false;
    }
  }, [status, enabled]);

  // قبول اعتراض — يُبث عبر gameFlow للجمهور والفرق.
  useEffect(() => {
    if (!enabled || !objectionNoticeKey) {
      return;
    }
    if (objectionPlayedRef.current !== objectionNoticeKey) {
      objectionPlayedRef.current = objectionNoticeKey;
      playCue("objection");
    }
  }, [objectionNoticeKey, enabled]);

  // انتقال سريع بين أسئلة المرحلة 4 — swoosh خفيف.
  useEffect(() => {
    if (!enabled || !status) {
      prevStatusRef.current = status ?? null;
      return;
    }
    const prev = prevStatusRef.current;
    prevStatusRef.current = status;
    if (
      prev === "stage4_reveal" &&
      (status === "stage4_question_open" || status === "stage4_waiting_question")
    ) {
      playCue("swoosh");
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
