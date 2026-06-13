import type { CompetitionTimer } from "@/types";

const PURPOSE_LABELS: Record<string, string> = {
  reading: "قراءة النص",
  matching: "مجال التوصيل",
  selection: "اختيار السؤال",
  answering: "وقت الإجابة",
  reveal: "الإعلان",
};

export function getTimerPurposeLabel(timer: CompetitionTimer | null | undefined): string | null {
  if (!timer?.purpose) {
    return null;
  }
  return PURPOSE_LABELS[timer.purpose] ?? timer.purpose;
}

export function getTimerStatusLabel(timer: CompetitionTimer | null | undefined): string {
  if (!timer?.active) {
    return "متوقف";
  }
  if (timer.paused) {
    return "موقوف";
  }
  return "نشط";
}

export function getTimerRingLabel(
  timer: CompetitionTimer | null | undefined,
  timerActive: boolean,
  isExpired: boolean,
): string {
  if (!timerActive) {
    return "متوقف";
  }
  if (isExpired) {
    return "انتهى";
  }
  if (timer?.paused) {
    return "موقوف";
  }
  return getTimerPurposeLabel(timer) ?? "متبقٍ";
}
