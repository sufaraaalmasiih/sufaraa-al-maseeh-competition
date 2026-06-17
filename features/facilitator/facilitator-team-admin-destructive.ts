import {
  getDoc,
  getDocs,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { getClientFirestore } from "@/firebase/firebaseClient";
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

/**
 * Delete a team entirely from the competition: answers, teamState, and profile doc.
 * Firebase Auth account remains until removed via Admin SDK / Console.
 */
export async function deleteTeamCompletely(input: {
  teamId: string;
  teamName: string;
  reason: string;
}): Promise<void> {
  const answersRef = answersCollectionRef(MAIN_COMPETITION_ID);
  const answersQuery = query(answersRef, where("teamId", "==", input.teamId));
  const answersSnapshot = await getDocs(answersQuery);
  const answerRefs = answersSnapshot.docs.map((docSnap) => docSnap.ref);

  for (let index = 0; index < answerRefs.length; index += FIRESTORE_BATCH_LIMIT) {
    const chunk = answerRefs.slice(index, index + FIRESTORE_BATCH_LIMIT);
    const batch = writeBatch(getClientFirestore());
    chunk.forEach((ref) => batch.delete(ref));
    await batch.commit();
  }

  const stateRef = teamStateRef(MAIN_COMPETITION_ID, input.teamId);
  const profileRef = teamRef(input.teamId);
  let beforeValue: Record<string, unknown> | null = null;

  await runTransaction(getClientFirestore(), async (transaction) => {
    const stateSnapshot = await transaction.get(stateRef);
    if (stateSnapshot.exists()) {
      const data = stateSnapshot.data();
      beforeValue = {
        teamName: typeof data.teamName === "string" ? data.teamName : input.teamName,
        governorate: typeof data.governorate === "string" ? data.governorate : "",
        totalScore: typeof data.totalScore === "number" ? data.totalScore : 0,
      };
      transaction.delete(stateRef);
    }

    const profileSnapshot = await transaction.get(profileRef);
    if (profileSnapshot.exists()) {
      transaction.delete(profileRef);
    }
  });

  await appendTeamAdminAuditLog({
    type: "delete_team_completely",
    teamId: input.teamId,
    teamName: input.teamName,
    deletedAnswers: answerRefs.length,
    reason: input.reason,
    beforeValue,
    afterValue: { deleted: true, deletedAnswers: answerRefs.length },
  });
}
