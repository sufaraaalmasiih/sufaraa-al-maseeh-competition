import type { AdminStageKey } from "@/features/facilitator/facilitator-team-admin";

export const STAGE_OPTIONS_LABELS: Record<AdminStageKey, string> = {
  stage1: "اجمعوا الكنوز",
  stage2: "فتشوا الكتب",
  stage3: "على المحك",
  stage4: "اثبتوا بالحق",
};

/** عناوين أعمدة النقاط في جداول النتائج والسجل. */
export const STAGE_SCORE_COLUMNS: { key: AdminStageKey; label: string }[] = [
  { key: "stage1", label: STAGE_OPTIONS_LABELS.stage1 },
  { key: "stage2", label: STAGE_OPTIONS_LABELS.stage2 },
  { key: "stage3", label: STAGE_OPTIONS_LABELS.stage3 },
  { key: "stage4", label: STAGE_OPTIONS_LABELS.stage4 },
];

export const STAGE_LOCK_OPTIONS: { key: AdminStageKey; label: string }[] = [
  { key: "stage1", label: STAGE_OPTIONS_LABELS.stage1 },
  { key: "stage2", label: STAGE_OPTIONS_LABELS.stage2 },
  { key: "stage3", label: STAGE_OPTIONS_LABELS.stage3 },
  { key: "stage4", label: STAGE_OPTIONS_LABELS.stage4 },
];

export const OVERRIDE_STATUS_OPTIONS: {
  label: string;
  status: string;
  currentStage: string;
  questionIndexScope?: "stage1" | "stage2" | "stage4";
  needsStage3Question?: boolean;
}[] = [
  { label: "شرح المرحلة الأولى", status: "stage1_intro", currentStage: "stage1" },
  {
    label: "المرحلة الأولى — قيد التنفيذ",
    status: "stage1_running",
    currentStage: "stage1",
    questionIndexScope: "stage1",
  },
  { label: "انتهت المرحلة الأولى", status: "stage1_finished", currentStage: "stage1" },
  { label: "شرح المرحلة الثانية", status: "stage2_intro", currentStage: "stage2" },
  { label: "توزيع المجالات", status: "stage2_role_assignment", currentStage: "stage2" },
  { label: "قراءة المرجع", status: "stage2_reading", currentStage: "stage2" },
  { label: "أسئلة المرحلة الثانية", status: "stage2_player_turns", currentStage: "stage2", questionIndexScope: "stage2" },
  { label: "انتهت المرحلة الثانية", status: "stage2_finished", currentStage: "stage2" },
  { label: "شرح على المحك", status: "stage3_intro", currentStage: "stage3" },
  { label: "لوحة على المحك", status: "stage3_board", currentStage: "stage3" },
  { label: "سؤال على المحك — مفتوح", status: "stage3_question_open", currentStage: "stage3", needsStage3Question: true },
  { label: "إعلان على المحك", status: "stage3_reveal", currentStage: "stage3" },
  { label: "انتهت المرحلة الثالثة", status: "stage3_finished", currentStage: "stage3" },
  { label: "شرح اثبتوا بالحق", status: "stage4_intro", currentStage: "stage4" },
  { label: "بانتظار سؤال المرحلة الرابعة", status: "stage4_waiting_question", currentStage: "stage4" },
  {
    label: "سؤال المرحلة الرابعة — مفتوح",
    status: "stage4_question_open",
    currentStage: "stage4",
    questionIndexScope: "stage4",
  },
  { label: "إعلان المرحلة الرابعة", status: "stage4_reveal", currentStage: "stage4" },
  { label: "انتهت المرحلة الرابعة", status: "stage4_finished", currentStage: "stage4" },
];

export const ANSWER_STAGE_FILTERS: { value: "all" | AdminStageKey; label: string }[] = [
  { value: "all", label: "كل المراحل" },
  { value: "stage1", label: STAGE_OPTIONS_LABELS.stage1 },
  { value: "stage2", label: STAGE_OPTIONS_LABELS.stage2 },
  { value: "stage3", label: STAGE_OPTIONS_LABELS.stage3 },
  { value: "stage4", label: STAGE_OPTIONS_LABELS.stage4 },
];
