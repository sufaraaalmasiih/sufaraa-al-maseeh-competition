import { getDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { MAIN_COMPETITION_ID, teamStateRef } from "@/firebase/firestore";
import { appendTeamAdminAuditLog } from "@/features/facilitator/facilitator-team-admin-audit";
import {
  parseTeamFacilitatorOverride,
  type TeamFacilitatorOverride,
} from "@/features/facilitator/team-control-types";
import { getStage4MockQuestionByIndex } from "@/features/stage4/stage4-mock-questions";
import { STAGE3_BOARD_FIELDS } from "@/features/stage3/stage3-board-data";
import { boardQuestionToMetadata } from "@/features/stage3/stage3-question-metadata";
import type { GameFlowStatus } from "@/types";

interface SetTeamFacilitatorOverrideInput {
  teamId: string;
  teamName: string;
  status: GameFlowStatus;
  currentStage: string;
  stage1QuestionIndex?: number;
  stage2QuestionIndex?: number;
  stage4QuestionIndex?: number;
  stage3QuestionId?: string;
  reason: string;
}

/** Send one team to an exceptional screen without changing global gameFlow. */
export async function setTeamFacilitatorOverride(
  input: SetTeamFacilitatorOverrideInput,
): Promise<void> {
  const ref = teamStateRef(MAIN_COMPETITION_ID, input.teamId);
  const progressPatch: Record<string, unknown> = {};
  const override: TeamFacilitatorOverride = {
    active: true,
    status: input.status,
    currentStage: input.currentStage,
  };

  const snapshot = await getDoc(ref);
  if (!snapshot.exists()) {
    throw new Error("الفريق غير موجود.");
  }
  const previousOverride = parseTeamFacilitatorOverride(snapshot.data()?.facilitatorOverride);
  const beforeValue = {
    status: previousOverride?.status ?? null,
    currentStage: previousOverride?.currentStage ?? null,
  };

  if (typeof input.stage1QuestionIndex === "number") {
    progressPatch["progress.stage1QuestionIndex"] = Math.max(0, input.stage1QuestionIndex);
    override.stage1QuestionIndex = progressPatch["progress.stage1QuestionIndex"] as number;
  }

  if (typeof input.stage2QuestionIndex === "number") {
    progressPatch["progress.stage2QuestionIndex"] = Math.max(0, input.stage2QuestionIndex);
    override.stage2QuestionIndex = progressPatch["progress.stage2QuestionIndex"] as number;
  }

  if (typeof input.stage4QuestionIndex === "number") {
    progressPatch["progress.stage4QuestionIndex"] = Math.max(0, input.stage4QuestionIndex);
    override.stage4QuestionIndex = progressPatch["progress.stage4QuestionIndex"] as number;
    if (input.status === "stage4_question_open") {
      const question = getStage4MockQuestionByIndex(override.stage4QuestionIndex);
      override.stage4ActiveQuestion = question;
    }
  }

  if (input.stage3QuestionId) {
    progressPatch["progress.stage3SelectedQuestionId"] = input.stage3QuestionId;
    override.stage3QuestionId = input.stage3QuestionId;
    if (input.status === "stage3_question_open") {
      for (const field of STAGE3_BOARD_FIELDS) {
        const boardQuestion = field.questions.find(
          (question) => question.id === input.stage3QuestionId,
        );
        if (boardQuestion) {
          override.stage3ActiveQuestion = boardQuestionToMetadata(boardQuestion, field.label);
          break;
        }
      }
    }
  }

  await updateDoc(ref, {
    facilitatorOverride: override,
    ...progressPatch,
    updatedAt: serverTimestamp(),
  });

  await appendTeamAdminAuditLog({
    type: "team_override",
    teamId: input.teamId,
    teamName: input.teamName,
    status: input.status,
    reason: input.reason,
    beforeValue,
    afterValue: {
      status: input.status,
      currentStage: input.currentStage,
    },
  });
}

export async function clearTeamFacilitatorOverride(input: {
  teamId: string;
  teamName: string;
  reason: string;
}): Promise<void> {
  const ref = teamStateRef(MAIN_COMPETITION_ID, input.teamId);
  const snapshot = await getDoc(ref);
  const previousOverride = snapshot.exists()
    ? parseTeamFacilitatorOverride(snapshot.data()?.facilitatorOverride)
    : null;

  await updateDoc(ref, {
    facilitatorOverride: null,
    updatedAt: serverTimestamp(),
  });

  await appendTeamAdminAuditLog({
    type: "clear_team_override",
    teamId: input.teamId,
    teamName: input.teamName,
    reason: input.reason,
    beforeValue: {
      status: previousOverride?.status ?? null,
      currentStage: previousOverride?.currentStage ?? null,
    },
    afterValue: { status: null, currentStage: null },
  });
}
