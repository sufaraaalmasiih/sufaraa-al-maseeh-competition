import type { AdminStageKey } from "@/features/facilitator/team-control-types";
import type { GameFlowStatus } from "@/types";

export const STAGE_INTRO_STATUS: Record<AdminStageKey, GameFlowStatus> = {
  stage1: "stage1_intro",
  stage2: "stage2_intro",
  stage3: "stage3_intro",
  stage4: "stage4_intro",
};

export function stageMigratePatch(stage: AdminStageKey): Record<string, unknown> {
  if (stage === "stage1") {
    return {
      "progress.stage1QuestionIndex": 0,
      "readiness.stage1Intro": false,
      "readiness.stage1": false,
    };
  }
  if (stage === "stage2") {
    return {
      "progress.stage2Field": "",
      "progress.stage2FieldIndex": 0,
      "progress.stage2QuestionIndex": 0,
      "readiness.stage2Intro": false,
      "readiness.stage2": false,
    };
  }
  if (stage === "stage3") {
    return {
      "progress.stage3SelectedQuestionId": "",
      "progress.stage3.currentField": "",
      "progress.stage3.questionIndex": 0,
      "readiness.stage3Intro": false,
      "readiness.stage3": false,
    };
  }
  return {
    "progress.stage4QuestionIndex": 0,
    "readiness.stage4Intro": false,
    "readiness.stage4": false,
  };
}
