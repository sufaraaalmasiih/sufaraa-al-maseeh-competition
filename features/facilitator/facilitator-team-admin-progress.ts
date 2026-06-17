import {
  getDoc,
  getDocs,
  runTransaction,
  serverTimestamp,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { getClientFirestore } from "@/firebase/firebaseClient";
import {
  gameFlowRef,
  MAIN_COMPETITION_ID,
  teamStateRef,
  teamStatesCollectionRef,
} from "@/firebase/firestore";
import {
  appendTeamAdminAuditLog,
  FIRESTORE_BATCH_LIMIT,
} from "@/features/facilitator/facilitator-team-admin-audit";
import {
  STAGE_INTRO_STATUS,
  stageMigratePatch,
} from "@/features/facilitator/facilitator-team-admin-migration-helpers";
import type { AdminStageKey } from "@/features/facilitator/team-control-types";

/** Reset a single team's progress for one stage (indices + selected question). */
export async function resetTeamStageProgress(input: {
  teamId: string;
  teamName: string;
  stage: AdminStageKey;
  reason: string;
}): Promise<void> {
  const ref = teamStateRef(MAIN_COMPETITION_ID, input.teamId);
  const patch: Record<string, unknown> = { updatedAt: serverTimestamp() };
  type TeamProgressSnapshot = {
    stage: AdminStageKey;
    stage1QuestionIndex: number;
    stage2QuestionIndex: number;
    stage2Field: string;
    stage3SelectedQuestionId: string;
    stage4QuestionIndex: number;
  };
  let beforeValue: TeamProgressSnapshot | null = null;

  if (input.stage === "stage1") {
    patch["progress.stage1QuestionIndex"] = 0;
  } else if (input.stage === "stage2") {
    patch["progress.stage2Field"] = "";
    patch["progress.stage2FieldIndex"] = 0;
    patch["progress.stage2QuestionIndex"] = 0;
  } else if (input.stage === "stage3") {
    patch["progress.stage3SelectedQuestionId"] = "";
    patch["progress.stage3.currentField"] = "";
    patch["progress.stage3.questionIndex"] = 0;
  } else {
    patch["progress.stage4QuestionIndex"] = 0;
  }

  await runTransaction(getClientFirestore(), async (transaction) => {
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists()) {
      throw new Error("الفريق غير موجود.");
    }

    const data = snapshot.data();
    const progress = (data.progress as Record<string, unknown>) ?? {};
    beforeValue = {
      stage: input.stage,
      stage1QuestionIndex: Number(progress.stage1QuestionIndex ?? 0),
      stage2QuestionIndex: Number(progress.stage2QuestionIndex ?? 0),
      stage2Field: String(progress.stage2Field ?? ""),
      stage3SelectedQuestionId: String(progress.stage3SelectedQuestionId ?? ""),
      stage4QuestionIndex: Number(progress.stage4QuestionIndex ?? 0),
    };
    transaction.update(ref, patch);
  });

  const progressBefore: TeamProgressSnapshot =
    beforeValue ?? {
      stage: input.stage,
      stage1QuestionIndex: 0,
      stage2QuestionIndex: 0,
      stage2Field: "",
      stage3SelectedQuestionId: "",
      stage4QuestionIndex: 0,
    };

  const afterValue: TeamProgressSnapshot = {
    stage: input.stage,
    stage1QuestionIndex: input.stage === "stage1" ? 0 : progressBefore.stage1QuestionIndex,
    stage2QuestionIndex: input.stage === "stage2" ? 0 : progressBefore.stage2QuestionIndex,
    stage2Field: input.stage === "stage2" ? "" : progressBefore.stage2Field,
    stage3SelectedQuestionId:
      input.stage === "stage3" ? "" : progressBefore.stage3SelectedQuestionId,
    stage4QuestionIndex: input.stage === "stage4" ? 0 : progressBefore.stage4QuestionIndex,
  };

  await appendTeamAdminAuditLog({
    type: "progress_reset",
    teamId: input.teamId,
    teamName: input.teamName,
    stage: input.stage,
    reason: input.reason,
    beforeValue,
    afterValue,
  });
}

/**
 * Zero every team's stage scores and total, keeping the teams registered.
 * Useful to re-run the competition without re-registering teams.
 */
export async function resetAllTeamScores(reason: string): Promise<number> {
  const snapshot = await getDocs(teamStatesCollectionRef(MAIN_COMPETITION_ID));
  const docs = snapshot.docs;

  for (let index = 0; index < docs.length; index += FIRESTORE_BATCH_LIMIT) {
    const chunk = docs.slice(index, index + FIRESTORE_BATCH_LIMIT);
    const batch = writeBatch(getClientFirestore());
    chunk.forEach((docSnap) => {
      batch.update(docSnap.ref, {
        "stageScores.stage1": 0,
        "stageScores.stage2": 0,
        "stageScores.stage3": 0,
        "stageScores.stage4": 0,
        totalScore: 0,
        updatedAt: serverTimestamp(),
      });
    });
    await batch.commit();
  }

  await appendTeamAdminAuditLog({
    type: "reset_all_scores",
    reason,
    teamCount: docs.length,
    beforeValue: { teamCount: docs.length, note: "نقاط جميع الفرق قبل التصفير" },
    afterValue: {
      teamCount: docs.length,
      stage1: 0,
      stage2: 0,
      stage3: 0,
      stage4: 0,
      total: 0,
    },
  });
  return docs.length;
}

/**
 * Send every team back to a stage intro at once: sets gameFlow to the stage
 * intro and resets that stage's per-team progress + readiness gate.
 */
export async function migrateAllTeamsToStage(
  stage: AdminStageKey,
  reason: string,
): Promise<number> {
  const snapshot = await getDocs(teamStatesCollectionRef(MAIN_COMPETITION_ID));
  const docs = snapshot.docs;
  const patch = { ...stageMigratePatch(stage), updatedAt: serverTimestamp() };

  for (let index = 0; index < docs.length; index += FIRESTORE_BATCH_LIMIT) {
    const chunk = docs.slice(index, index + FIRESTORE_BATCH_LIMIT);
    const batch = writeBatch(getClientFirestore());
    chunk.forEach((docSnap) => batch.update(docSnap.ref, patch));
    await batch.commit();
  }

  const gameFlowSnapshot = await getDoc(gameFlowRef);
  const previousStage =
    typeof gameFlowSnapshot.data()?.currentStage === "string"
      ? gameFlowSnapshot.data()?.currentStage
      : null;

  await updateDoc(gameFlowRef, {
    status: STAGE_INTRO_STATUS[stage],
    currentStage: stage,
    updatedAt: serverTimestamp(),
  });

  await appendTeamAdminAuditLog({
    type: "migrate_all_teams",
    stage,
    reason,
    teamCount: docs.length,
    beforeValue: { stage: previousStage, teamCount: docs.length },
    afterValue: { stage, teamCount: docs.length },
  });
  return docs.length;
}
