"use client";

import { useEffect, useRef } from "react";
import { useGameFlow } from "@/features/gameflow/use-game-flow";
import { useCompetitionTimer } from "@/features/gameflow/use-competition-timer";
import { autoCloseStage4Answers } from "@/features/stage4/auto-close-stage4-answers";
import { openStage4Question } from "@/features/stage4/open-stage4-question";
import { startStage4Reveal } from "@/features/stage4/start-stage4-reveal";
import { advanceStage4Question } from "@/features/stage4/advance-stage4-question";

/**
 * يبقي أتمتة «اثبتوا بالحق» (المرحلة 4) تعمل من أي عميل متصل:
 * فتح السؤال (selection) ← الإجابة ← إغلاق الإجابة ← الإعلان (reveal) ← السؤال التالي.
 * كلها تلقائية على المؤقت افتراضياً؛ أزرار الميسر اليدوية تبقى متاحة (manual = opt-in).
 */
export function FacilitatorStage4Automation() {
  const { status, currentStage, competitionFrozen } = useGameFlow();
  const { timer, isExpired } = useCompetitionTimer();
  const attemptedRef = useRef<string | null>(null);

  useEffect(() => {
    if (competitionFrozen || currentStage !== "stage4") {
      return;
    }

    // إغلاق الإجابة عند انتهاء مؤقتها — منطق إعادة محاولة لاحترام نافذة الإجابة الدنيا.
    if (
      status === "stage4_question_open" &&
      timer?.active &&
      timer.stage === "stage4" &&
      timer.purpose === "answering" &&
      timer.paused !== true &&
      isExpired
    ) {
      const fingerprint = `close:${String(timer.endsAtMs)}`;
      if (attemptedRef.current === fingerprint) {
        return;
      }

      let cancelled = false;
      let intervalId: number | undefined;

      const tryClose = () => {
        void autoCloseStage4Answers()
          .then((result) => {
            if (cancelled) {
              return;
            }
            if (!result.skipped || result.reason !== "window") {
              attemptedRef.current = fingerprint;
              if (intervalId !== undefined) {
                window.clearInterval(intervalId);
              }
            }
          })
          .catch(() => {
            if (!cancelled) {
              attemptedRef.current = null;
            }
          });
      };

      tryClose();
      intervalId = window.setInterval(tryClose, 1_000);

      return () => {
        cancelled = true;
        if (intervalId !== undefined) {
          window.clearInterval(intervalId);
        }
      };
    }

    // إعلان النتائج تلقائياً بمجرد إغلاق الإجابات (لا مؤقت في هذا الطور).
    if (status === "stage4_answers_closed") {
      const fingerprint = "reveal:answers_closed";
      if (attemptedRef.current === fingerprint) {
        return;
      }
      attemptedRef.current = fingerprint;
      void startStage4Reveal().catch(() => {
        attemptedRef.current = null;
      });
      return;
    }

    let action: (() => Promise<unknown>) | null = null;

    if (
      status === "stage4_waiting_question" &&
      timer?.active &&
      timer.stage === "stage4" &&
      timer.purpose === "selection" &&
      timer.paused !== true &&
      isExpired
    ) {
      action = openStage4Question;
    } else if (
      status === "stage4_reveal" &&
      timer?.active &&
      timer.stage === "stage4" &&
      timer.purpose === "reveal" &&
      timer.paused !== true &&
      isExpired
    ) {
      action = advanceStage4Question;
    }

    if (!action) {
      return;
    }

    const fingerprint = `${status}:${timer?.purpose ?? ""}:${String(timer?.endsAtMs)}`;
    if (attemptedRef.current === fingerprint) {
      return;
    }
    attemptedRef.current = fingerprint;

    void action().catch(() => {
      attemptedRef.current = null;
    });
  }, [
    status,
    currentStage,
    competitionFrozen,
    isExpired,
    timer?.active,
    timer?.stage,
    timer?.purpose,
    timer?.endsAtMs,
    timer?.paused,
  ]);

  return null;
}
