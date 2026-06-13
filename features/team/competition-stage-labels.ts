import type { GameFlowStatus } from "@/types";

const STAGE_LABELS: Partial<Record<GameFlowStatus, string>> = {
  stage1_intro: "المرحلة الأولى",
  stage1_running: "المرحلة الأولى",
  stage1_finished: "المرحلة الأولى",
  stage2_intro: "المرحلة الثانية",
  stage2_role_assignment: "المرحلة الثانية",
  stage2_reading: "المرحلة الثانية",
  stage2_player_turns: "المرحلة الثانية",
  stage2_finished: "المرحلة الثانية",
  stage3_intro: "المرحلة الثالثة",
  stage3_board: "المرحلة الثالثة",
  stage3_question_open: "المرحلة الثالثة",
  stage3_answer_closed: "المرحلة الثالثة",
  stage3_reveal: "المرحلة الثالثة",
  stage3_results_done: "المرحلة الثالثة",
  stage3_finished: "المرحلة الثالثة",
  stage4_intro: "المرحلة الرابعة",
  stage4_waiting_question: "المرحلة الرابعة",
  stage4_question_open: "المرحلة الرابعة",
  stage4_answers_closed: "المرحلة الرابعة",
  stage4_reveal: "المرحلة الرابعة",
  stage4_finished: "المرحلة الرابعة",
  final_results: "النتائج النهائية",
  podium: "منصة التكريم",
};

export function getCompetitionStageLabel(status: GameFlowStatus | null): string {
  if (!status) {
    return "المسابقة";
  }

  return STAGE_LABELS[status] ?? "المسابقة";
}

export function isTeamGameplayStatus(status: GameFlowStatus | null): boolean {
  if (!status) {
    return false;
  }

  return (
    status.startsWith("stage1_") ||
    status.startsWith("stage2_") ||
    status.startsWith("stage3_") ||
    status.startsWith("stage4_") ||
    status === "final_results" ||
    status === "podium"
  );
}
