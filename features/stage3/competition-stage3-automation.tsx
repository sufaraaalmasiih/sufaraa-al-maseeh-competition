"use client";

import { useEffect, useRef } from "react";
import { useGameFlow } from "@/features/gameflow/use-game-flow";
import { useCompetitionTimer } from "@/features/gameflow/use-competition-timer";
import { useAuthRole } from "@/hooks/use-auth-role";
import { handleStage3SelectionTimeout } from "@/features/stage3/handle-stage3-selection-timeout";
import { autoCloseAndRevealStage3Question } from "@/features/stage3/auto-close-and-reveal-stage3-question";
import { autoFinishStage3RevealAndReturnBoard } from "@/features/stage3/auto-finish-stage3-reveal-and-return-board";

/**
 * Headless watcher that drives Stage 3 timed automation. The transitions write
 * gameFlow/timer, which Firestore rules allow only for the facilitator — so this
 * runs ONLY for staff. On team/audience clients it would just spam rejected
 * writes, so we gate it by role (handlers stay idempotent).
 */
export function CompetitionStage3Automation() {
  const { status, currentStage, competitionFrozen } = useGameFlow();
  const { timer, isExpired } = useCompetitionTimer();
  const { role } = useAuthRole();
  const isStaff = role === "facilitator" || role === "super_admin";
  const attemptedRef = useRef<string | null>(null);

  useEffect(() => {
    if (
      !isStaff ||
      competitionFrozen ||
      currentStage !== "stage3" ||
      !isExpired ||
      !timer?.active ||
      timer.stage !== "stage3" ||
      timer.paused === true
    ) {
      return;
    }

    const fingerprint = `${status ?? ""}:${timer.purpose}:${String(timer.endsAtMs)}`;
    if (attemptedRef.current === fingerprint) {
      return;
    }

    let action: (() => Promise<{ skipped: boolean }>) | null = null;

    if (status === "stage3_board" && timer.purpose === "selection") {
      action = handleStage3SelectionTimeout;
    } else if (
      (status === "stage3_question_open" || status === "stage3_answer_closed") &&
      timer.purpose === "answering"
    ) {
      action = autoCloseAndRevealStage3Question;
    } else if (status === "stage3_reveal" && timer.purpose === "reveal") {
      action = autoFinishStage3RevealAndReturnBoard;
    }

    if (!action) {
      return;
    }

    // إصلاح جذري: لا نقفل البصمة إلا عند نجاح فعلي (skipped === false). إن تخطّى
    // الإجراء مؤقتاً (سباق ربع الثانية بين tick والمعاملة، أو تأخّر انتشار اللقطة)
    // نعيد المحاولة كل ثانية بدل أن نعلق للأبد — هذا سبب عدم الانتقال التلقائي سابقاً.
    const run = action;
    let cancelled = false;
    let intervalId: number | undefined;

    const attempt = () => {
      void run()
        .then((result) => {
          if (cancelled) {
            return;
          }
          if (!result.skipped) {
            attemptedRef.current = fingerprint;
            if (intervalId !== undefined) {
              window.clearInterval(intervalId);
            }
          }
        })
        .catch(() => {
          // خطأ عابر (تعارض معاملة مثلاً) — نترك التكرار يعيد المحاولة.
        });
    };

    attempt();
    intervalId = window.setInterval(attempt, 1_000);

    return () => {
      cancelled = true;
      if (intervalId !== undefined) {
        window.clearInterval(intervalId);
      }
    };
  }, [
    isStaff,
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
