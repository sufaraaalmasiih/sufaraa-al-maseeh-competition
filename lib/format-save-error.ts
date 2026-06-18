import {
  COMPETITION_FROZEN_MESSAGE,
  TIMER_PAUSED_MESSAGE,
} from "@/lib/competition-guards";

const FIREBASE_CODE_MESSAGES: Record<string, string> = {
  "permission-denied": "لا توجد صلاحية لحفظ الإجابة. تأكد من تسجيل الدخول بحساب الفريق.",
  unauthenticated: "يلزم تسجيل الدخول بحساب الفريق قبل حفظ الإجابة.",
  unavailable: "تعذر الاتصال بالخادم. تحقق من الإنترنت وحاول مرة أخرى.",
  "failed-precondition": "تغيّرت حالة المسابقة. أعد تحميل الصفحة وحاول مرة أخرى.",
  aborted: "تعذر إتمام الحفظ بسبب تعارض. حاول مرة أخرى.",
};

const MESSAGE_TRANSLATIONS: Array<[RegExp, string]> = [
  [/timer expired|انتهى/i, "انتهى وقت الإجابة."],
  [/Stage 1 is not accepting answers/i, "المرحلة الأولى لا تقبل إجابات الآن."],
  [/Missing team profile or team state/i, "بيانات الفريق غير مكتملة. أعد تسجيل الدخول أو تواصل مع الميسر."],
  [/Missing authenticated team/i, "يلزم تسجيل الدخول بحساب الفريق."],
  [/تم إغلاق هذه المرحلة/i, "تم إغلاق هذه المرحلة من قبل الميسر."],
  [/Missing or insufficient permissions/i, FIREBASE_CODE_MESSAGES["permission-denied"]],
];

function readErrorCode(error: unknown): string | null {
  if (!error || typeof error !== "object") {
    return null;
  }

  const code = (error as { code?: unknown }).code;
  return typeof code === "string" ? code : null;
}

function readErrorMessage(error: unknown): string | null {
  if (typeof error === "string" && error.trim()) {
    return error.trim();
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message.trim();
  }

  if (error && typeof error === "object") {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) {
      return message.trim();
    }
  }

  return null;
}

function translateKnownMessage(message: string): string | null {
  if (message === COMPETITION_FROZEN_MESSAGE || message === TIMER_PAUSED_MESSAGE) {
    return message;
  }

  for (const [pattern, translated] of MESSAGE_TRANSLATIONS) {
    if (pattern.test(message)) {
      return translated;
    }
  }

  return null;
}

export function formatSaveError(
  error: unknown,
  fallback = "تعذر حفظ الإجابة. تحقق من الاتصال وحاول مرة أخرى.",
): string {
  const code = readErrorCode(error);
  if (code && FIREBASE_CODE_MESSAGES[code]) {
    return FIREBASE_CODE_MESSAGES[code];
  }

  const message = readErrorMessage(error);
  if (!message) {
    return fallback;
  }

  const translated = translateKnownMessage(message);
  if (translated) {
    return translated;
  }

  return message;
}

export function formatSaveErrorFromCode(error: unknown): string {
  return formatSaveError(error);
}
