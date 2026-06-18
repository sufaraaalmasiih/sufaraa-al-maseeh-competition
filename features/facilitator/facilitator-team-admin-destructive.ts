import {
  deleteDoc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { getClientFirestore } from "@/firebase/firebaseClient";
import { callAdminApiOptional } from "@/lib/admin-api-client";
import {
  answersCollectionRef,
  buildInitialTeamStateDocument,
  MAIN_COMPETITION_ID,
  teamRef,
  teamStateRef,
} from "@/firebase/firestore";
import {
  appendTeamAdminAuditLog,
  FIRESTORE_BATCH_LIMIT,
} from "@/features/facilitator/facilitator-team-admin-audit";
import type { AdminStageKey } from "@/features/facilitator/team-control-types";

/** Delete a team's answers, optionally filtered by stage. */
export async function deleteTeamAnswers(input: {
  teamId: string;
  teamName: string;
  stage: AdminStageKey | "all";
  reason: string;
  skipAuditLog?: boolean;
}): Promise<number> {
  const answersRef = answersCollectionRef(MAIN_COMPETITION_ID);
  const answersQuery =
    input.stage === "all"
      ? query(answersRef, where("teamId", "==", input.teamId))
      : query(
          answersRef,
          where("teamId", "==", input.teamId),
          where("stage", "==", input.stage),
        );

  const snapshot = await getDocs(answersQuery);
  const refs = snapshot.docs.map((docSnap) => docSnap.ref);

  for (let index = 0; index < refs.length; index += FIRESTORE_BATCH_LIMIT) {
    const chunk = refs.slice(index, index + FIRESTORE_BATCH_LIMIT);
    const batch = writeBatch(getClientFirestore());
    chunk.forEach((ref) => batch.delete(ref));
    await batch.commit();
  }

  if (!input.skipAuditLog) {
    await appendTeamAdminAuditLog({
      type: "delete_team_answers",
      teamId: input.teamId,
      teamName: input.teamName,
      stage: input.stage,
      deletedCount: refs.length,
      reason: input.reason,
      beforeValue: { stage: input.stage, answerCount: refs.length },
      afterValue: { stage: input.stage, answerCount: 0, deletedCount: refs.length },
    });
  }

  return refs.length;
}

/**
 * Reset one team's competition data (scores, progress, readiness, override, answers)
 * while keeping the team profile and teamState registration.
 */
export async function resetTeamCompetitionData(input: {
  teamId: string;
  teamName: string;
  governorate: string;
  reason: string;
}): Promise<void> {
  const stateRef = teamStateRef(MAIN_COMPETITION_ID, input.teamId);
  const snapshot = await getDoc(stateRef);
  const beforeValue = snapshot.exists()
    ? {
        totalScore: snapshot.data()?.totalScore ?? 0,
        stageScores: snapshot.data()?.stageScores ?? {},
        progress: snapshot.data()?.progress ?? {},
      }
    : null;

  await deleteTeamAnswers({
    teamId: input.teamId,
    teamName: input.teamName,
    stage: "all",
    reason: input.reason,
    skipAuditLog: true,
  });

  await setDoc(
    teamStateRef(MAIN_COMPETITION_ID, input.teamId),
    buildInitialTeamStateDocument(input.teamId, input.teamName, input.governorate),
  );

  await appendTeamAdminAuditLog({
    type: "reset_team_competition_data",
    teamId: input.teamId,
    teamName: input.teamName,
    reason: input.reason,
    beforeValue,
    afterValue: {
      totalScore: 0,
      stageScores: { stage1: 0, stage2: 0, stage3: 0, stage4: 0 },
      progress: "مُصفَّر",
    },
  });
}

async function deleteTeamFirestoreOnClient(input: {
  teamId: string;
  teamName: string;
  reason: string;
}): Promise<number> {
  return deleteTeamAnswers({
    teamId: input.teamId,
    teamName: input.teamName,
    stage: "all",
    reason: input.reason,
    skipAuditLog: true,
  });
}

async function appendDeleteTeamCompletelyAudit(input: {
  teamId: string;
  teamName: string;
  reason: string;
  beforeValue: Record<string, unknown> | null;
  deletedAnswers: number;
  authDeleted: boolean;
}): Promise<void> {
  try {
    await appendTeamAdminAuditLog({
      type: "delete_team_completely",
      teamId: input.teamId,
      teamName: input.teamName,
      deletedAnswers: input.deletedAnswers,
      reason: input.reason,
      beforeValue: input.beforeValue,
      afterValue: {
        deleted: true,
        deletedAnswers: input.deletedAnswers,
        authDeleted: input.authDeleted,
      },
    });
  } catch {
    // Audit failure must not block team deletion.
  }
}

/**
 * Delete a team entirely: Firestore via super-admin API (preferred) or facilitator client rules.
 */
export async function deleteTeamCompletely(input: {
  teamId: string;
  teamName: string;
  reason: string;
}): Promise<{ authDeleted: boolean }> {
  const stateRef = teamStateRef(MAIN_COMPETITION_ID, input.teamId);
  const stateSnapshot = await getDoc(stateRef);
  const beforeValue = stateSnapshot.exists()
    ? {
        teamName:
          typeof stateSnapshot.data()?.teamName === "string"
            ? stateSnapshot.data()?.teamName
            : input.teamName,
        governorate:
          typeof stateSnapshot.data()?.governorate === "string"
            ? stateSnapshot.data()?.governorate
            : "",
        totalScore:
          typeof stateSnapshot.data()?.totalScore === "number"
            ? stateSnapshot.data()?.totalScore
            : 0,
      }
    : null;

  const apiResult = await callAdminApiOptional<{
    firestoreDeleted?: boolean;
    deletedAnswers?: number;
    authDeleted?: boolean;
  }>("/api/admin/delete-team", { teamId: input.teamId });

  if (apiResult.ok && apiResult.data.firestoreDeleted) {
    await appendDeleteTeamCompletelyAudit({
      ...input,
      beforeValue,
      deletedAnswers: apiResult.data.deletedAnswers ?? 0,
      authDeleted: apiResult.data.authDeleted ?? false,
    });
    return { authDeleted: apiResult.data.authDeleted ?? false };
  }

  const deletedAnswers = await deleteTeamFirestoreOnClient(input);

  if (stateSnapshot.exists()) {
    await deleteDoc(stateRef);
  }

  const teamProfileRef = teamRef(input.teamId);
  const teamProfileSnapshot = await getDoc(teamProfileRef);
  if (teamProfileSnapshot.exists()) {
    await deleteDoc(teamProfileRef);
  }

  let authDeleted = false;
  if (apiResult.ok) {
    authDeleted = apiResult.data.authDeleted ?? false;
  }

  await appendDeleteTeamCompletelyAudit({
    ...input,
    beforeValue,
    deletedAnswers,
    authDeleted,
  });

  return { authDeleted };
}
