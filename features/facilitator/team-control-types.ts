import type { GameFlowStatus } from "@/types";
import type { Stage3QuestionMetadata } from "@/features/stage3/stage3-question-types";
import type { Stage4QuestionMetadata } from "@/features/stage4/stage4-question-types";

export type AdminStageKey = "stage1" | "stage2" | "stage3" | "stage4";

export interface TeamStageLocks {
  stage1: boolean;
  stage2: boolean;
  stage3: boolean;
  stage4: boolean;
}

export const DEFAULT_TEAM_STAGE_LOCKS: TeamStageLocks = {
  stage1: false,
  stage2: false,
  stage3: false,
  stage4: false,
};

export interface TeamFacilitatorOverride {
  active: boolean;
  status: GameFlowStatus;
  currentStage: string;
  stage1QuestionIndex?: number;
  stage2QuestionIndex?: number;
  stage4QuestionIndex?: number;
  stage3QuestionId?: string;
  stage3ActiveQuestion?: Stage3QuestionMetadata | null;
  stage4ActiveQuestion?: Stage4QuestionMetadata | null;
}

export function parseTeamStageLocks(raw: unknown): TeamStageLocks {
  const parsed = (raw ?? {}) as Partial<TeamStageLocks>;
  return {
    stage1: parsed.stage1 === true,
    stage2: parsed.stage2 === true,
    stage3: parsed.stage3 === true,
    stage4: parsed.stage4 === true,
  };
}

export function parseTeamFacilitatorOverride(raw: unknown): TeamFacilitatorOverride | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const data = raw as Partial<TeamFacilitatorOverride>;
  if (data.active !== true || typeof data.status !== "string") {
    return null;
  }

  return {
    active: true,
    status: data.status as GameFlowStatus,
    currentStage: typeof data.currentStage === "string" ? data.currentStage : "none",
    stage1QuestionIndex:
      typeof data.stage1QuestionIndex === "number" ? data.stage1QuestionIndex : undefined,
    stage2QuestionIndex:
      typeof data.stage2QuestionIndex === "number" ? data.stage2QuestionIndex : undefined,
    stage4QuestionIndex:
      typeof data.stage4QuestionIndex === "number" ? data.stage4QuestionIndex : undefined,
    stage3QuestionId:
      typeof data.stage3QuestionId === "string" ? data.stage3QuestionId : undefined,
    stage3ActiveQuestion:
      data.stage3ActiveQuestion && typeof data.stage3ActiveQuestion === "object"
        ? data.stage3ActiveQuestion
        : null,
    stage4ActiveQuestion:
      data.stage4ActiveQuestion && typeof data.stage4ActiveQuestion === "object"
        ? data.stage4ActiveQuestion
        : null,
  };
}

export function getStageKeyFromGameFlowStatus(
  status: GameFlowStatus,
): AdminStageKey | null {
  if (status.startsWith("stage1")) {
    return "stage1";
  }
  if (status.startsWith("stage2")) {
    return "stage2";
  }
  if (status.startsWith("stage3")) {
    return "stage3";
  }
  if (status.startsWith("stage4")) {
    return "stage4";
  }
  return null;
}

export function isTeamStageLocked(
  locks: TeamStageLocks,
  status: GameFlowStatus,
): boolean {
  const stageKey = getStageKeyFromGameFlowStatus(status);
  return stageKey ? locks[stageKey] : false;
}

export function assertTeamStageUnlocked(
  locksRaw: unknown,
  stage: AdminStageKey,
): void {
  const locks = parseTeamStageLocks(locksRaw);
  if (locks[stage]) {
    throw new Error("تم إغلاق هذه المرحلة من قبل الميسر.");
  }
}
