import {
  COMPETITION_FROZEN_MESSAGE,
  TIMER_PAUSED_MESSAGE,
} from "@/lib/competition-guards";

export function formatSaveError(
  error: unknown,
  fallback = "تعذر حفظ الإجابة. تحقق من الاتصال وحاول مرة أخرى.",
): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
}

export function formatSaveErrorFromCode(error: unknown): string {
  if (!(error instanceof Error)) {
    return formatSaveError(error);
  }

  if (error.message.includes("timer expired") || error.message.includes("انتهى")) {
    return "انتهى وقت الإجابة.";
  }

  if (error.message === COMPETITION_FROZEN_MESSAGE) {
    return COMPETITION_FROZEN_MESSAGE;
  }

  if (error.message === TIMER_PAUSED_MESSAGE) {
    return TIMER_PAUSED_MESSAGE;
  }

  return formatSaveError(error);
}
