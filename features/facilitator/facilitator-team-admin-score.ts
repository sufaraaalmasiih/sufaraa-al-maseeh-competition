import { runTransaction, serverTimestamp } from "firebase/firestore";
import { getClientFirestore } from "@/firebase/firebaseClient";
import { MAIN_COMPETITION_ID, teamStateRef } from "@/firebase/firestore";
import { appendTeamAdminAuditLog } from "@/features/facilitator/facilitator-team-admin-audit";
import type { AdminStageKey } from "@/features/facilitator/team-control-types";

/**
 * Manually adjust a team's stage score and total by a signed delta.
 * Records the reason in the audit log.
 */
export async function adjustTeamScore(input: {
  teamId: string;
  teamName: string;
  stage: AdminStageKey;
  delta: number;
  reason: string;
}): Promise<void> {
  const ref = teamStateRef(MAIN_COMPETITION_ID, input.teamId);
  let beforeValue: Record<string, unknown> | null = null;
  let afterValue: Record<string, unknown> | null = null;

  await runTransaction(getClientFirestore(), async (transaction) => {
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists()) {
      throw new Error("الفريق غير موجود.");
    }

    const data = snapshot.data();
    const stageScores = (data.stageScores as Record<string, number>) ?? {};
    const currentStage =
      typeof stageScores[input.stage] === "number" ? stageScores[input.stage] : 0;
    const currentTotal =
      typeof data.totalScore === "number" ? data.totalScore : 0;

    const nextStage = Math.max(0, currentStage + input.delta);
    const appliedDelta = nextStage - currentStage;
    const nextTotal = Math.max(0, currentTotal + appliedDelta);

    beforeValue = {
      stage: input.stage,
      stageScore: currentStage,
      totalScore: currentTotal,
    };
    afterValue = {
      stage: input.stage,
      stageScore: nextStage,
      totalScore: nextTotal,
      delta: input.delta,
    };

    transaction.update(ref, {
      [`stageScores.${input.stage}`]: nextStage,
      totalScore: nextTotal,
      updatedAt: serverTimestamp(),
    });
  });

  await appendTeamAdminAuditLog({
    type: "score_adjust",
    teamId: input.teamId,
    teamName: input.teamName,
    stage: input.stage,
    delta: input.delta,
    reason: input.reason,
    beforeValue,
    afterValue,
  });
}
