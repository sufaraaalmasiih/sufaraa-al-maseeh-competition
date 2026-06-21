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

const STAGE_KEYS: AdminStageKey[] = ["stage1", "stage2", "stage3", "stage4"];

/**
 * تعيين نقاط فريق لكل مرحلة بقيم مطلقة (تعديل تفصيلي) — تُحسب القيم المعدّلة فقط،
 * ويُعاد المجموع وفق الفروق المطبّقة. يُسجَّل السبب وقيمة قبل/بعد في الأرشيف.
 * (تحديث الميسّر لـteamStates غير محدود بسقف ±100، فيمكن ضبط أي قيمة.)
 */
export async function setTeamStageScores(input: {
  teamId: string;
  teamName: string;
  /** القيم المطلقة المطلوبة لكل مرحلة (المراحل غير المذكورة تبقى كما هي). */
  stageScores: Partial<Record<AdminStageKey, number>>;
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
    const currentStages = (data.stageScores as Record<string, number>) ?? {};
    const currentTotal = typeof data.totalScore === "number" ? data.totalScore : 0;

    const beforeStages: Record<string, number> = {};
    const afterStages: Record<string, number> = {};
    const update: Record<string, unknown> = { updatedAt: serverTimestamp() };
    let appliedDelta = 0;

    for (const stage of STAGE_KEYS) {
      const current = typeof currentStages[stage] === "number" ? currentStages[stage] : 0;
      beforeStages[stage] = current;

      const requested = input.stageScores[stage];
      if (typeof requested === "number" && Number.isFinite(requested)) {
        const next = Math.max(0, Math.round(requested));
        afterStages[stage] = next;
        if (next !== current) {
          update[`stageScores.${stage}`] = next;
          appliedDelta += next - current;
        }
      } else {
        afterStages[stage] = current;
      }
    }

    const nextTotal = Math.max(0, currentTotal + appliedDelta);
    update.totalScore = nextTotal;

    beforeValue = { stageScores: beforeStages, totalScore: currentTotal };
    afterValue = { stageScores: afterStages, totalScore: nextTotal };

    transaction.update(ref, update);
  });

  await appendTeamAdminAuditLog({
    type: "score_set",
    teamId: input.teamId,
    teamName: input.teamName,
    reason: input.reason,
    beforeValue,
    afterValue,
  });
}
