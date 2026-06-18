import type { FieldValue } from "firebase/firestore";
import type { TimerPurpose } from "@/types";

/**
 * مؤقتات مراحل «اثبتوا بالحق» (المرحلة 4) للأطوار غير الإجابة:
 * اختيار/فتح السؤال (selection) والإعلان (reveal). تُبنى بنفس شكل مؤقت الإجابة
 * حتى تقرأها كل الشاشات وتشغّلها الأتمتة تلقائياً.
 */
export function buildStage4PhaseTimerPayload(
  now: number,
  updatedAt: FieldValue,
  purpose: Extract<TimerPurpose, "selection" | "reveal">,
  seconds: number,
) {
  return {
    active: true,
    stage: "stage4" as const,
    purpose,
    durationSeconds: seconds,
    startedAtMs: now,
    endsAtMs: now + seconds * 1000,
    paused: false,
    pausedRemainingMs: 0,
    updatedAt,
  };
}
