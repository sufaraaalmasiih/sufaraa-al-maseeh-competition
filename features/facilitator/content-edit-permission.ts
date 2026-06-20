import { isQuestionBankImportAllowedStatus } from "@/features/facilitator/question-bank-lock";
import { isTrainingMode, type CompetitionMode } from "@/features/facilitator/competition-mode";
import type { AppRole, GameFlowStatus } from "@/types";

export interface ContentEditGate {
  editable: boolean;
  reason: string | null;
}

/**
 * من يعدّل محتوى المسابقة (رفع/تعديل الأسئلة، الإعدادات):
 * - المشرف العام: دائماً (قبل بدء المسابقة).
 * - الميسّر: في الحصص التدريبية فقط — لا في المسابقات الرسمية.
 * - مقفول للجميع أثناء المسابقة الجارية.
 */
export function resolveContentEditGate(input: {
  role: AppRole | null;
  status: GameFlowStatus | null | undefined;
  competitionMode: CompetitionMode;
}): ContentEditGate {
  if (!isQuestionBankImportAllowedStatus(input.status)) {
    return {
      editable: false,
      reason: "أثناء المسابقة الجارية لا يمكن التعديل. أوقف المسابقة أو أعد التعيين أولاً.",
    };
  }

  const isSuperAdmin = input.role === "super_admin";
  if (!isSuperAdmin && !isTrainingMode(input.competitionMode)) {
    return {
      editable: false,
      reason:
        "في المسابقات الرسمية، تعديل الأسئلة والإعدادات متاح للمشرف العام فقط. الميسّر يعدّلها في الحصص التدريبية فقط.",
    };
  }

  return { editable: true, reason: null };
}
