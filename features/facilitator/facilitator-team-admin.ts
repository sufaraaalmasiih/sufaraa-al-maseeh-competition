"use client";

import {
  addDoc,
  collection,
  getDoc,
  getDocs,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { firestore } from "@/firebase/firebaseClient";
import { firebaseAuth } from "@/firebase/firebaseClient";
import {
  answersCollectionRef,
  buildInitialTeamStateDocument,
  gameFlowRef,
  MAIN_COMPETITION_ID,
  teamRef,
  teamStateRef,
  teamStatesCollectionRef,
} from "@/firebase/firestore";
import { appendActiveSessionEditLog } from "@/features/facilitator/competition-session";
import {
  DEFAULT_TEAM_STAGE_LOCKS,
  parseTeamFacilitatorOverride,
  type TeamFacilitatorOverride,
  type TeamStageLocks,
} from "@/features/facilitator/team-control-types";
import { getStage4MockQuestionByIndex } from "@/features/stage4/stage4-mock-questions";
import { STAGE3_BOARD_FIELDS } from "@/features/stage3/stage3-board-data";
import { boardQuestionToMetadata } from "@/features/stage3/stage3-question-metadata";
import type { GameFlowStatus } from "@/types";
import type { TeamPlayer } from "@/types";

import type { AdminStageKey } from "@/features/facilitator/team-control-types";

export type { AdminStageKey };

const FIRESTORE_BATCH_LIMIT = 500;

const STAGE_INTRO_STATUS: Record<AdminStageKey, GameFlowStatus> = {
  stage1: "stage1_intro",
  stage2: "stage2_intro",
  stage3: "stage3_intro",
  stage4: "stage4_intro",
};

function stageMigratePatch(stage: AdminStageKey): Record<string, unknown> {
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
      "readiness.stage2": false,
    };
  }
  if (stage === "stage3") {
    return {
      "progress.stage3SelectedQuestionId": "",
      "progress.stage3.currentField": "",
      "progress.stage3.questionIndex": 0,
      "readiness.stage3": false,
    };
  }
  return {
    "progress.stage4QuestionIndex": 0,
    "readiness.stage4": false,
  };
}

function auditLogCollection() {
  return collection(
    firestore,
    "competitions",
    MAIN_COMPETITION_ID,
    "auditLog",
  );
}

/** Best-effort audit trail. Never blocks the primary mutation. */
async function appendAuditLog(entry: Record<string, unknown>): Promise<void> {
  try {
    await addDoc(auditLogCollection(), {
      ...entry,
      actorUid: firebaseAuth.currentUser?.uid ?? null,
      createdAt: serverTimestamp(),
    });
    await appendActiveSessionEditLog({
      action: String(entry.type ?? "unknown"),
      reason: String(entry.reason ?? ""),
      teamId: typeof entry.teamId === "string" ? entry.teamId : null,
      teamName: typeof entry.teamName === "string" ? entry.teamName : null,
      beforeValue: entry.beforeValue ?? null,
      afterValue: entry.afterValue ?? null,
      details: entry,
    });
  } catch {
    // Audit log is non-critical; ignore failures (e.g. rules / offline).
  }
}

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

  await runTransaction(firestore, async (transaction) => {
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

    transaction.update(ref, {
      [`stageScores.${input.stage}`]: nextStage,
      totalScore: Math.max(0, currentTotal + appliedDelta),
      updatedAt: serverTimestamp(),
    });
  });

  await appendAuditLog({
    type: "score_adjust",
    teamId: input.teamId,
    teamName: input.teamName,
    stage: input.stage,
    delta: input.delta,
    reason: input.reason,
  });
}

/** Reset a single team's progress for one stage (indices + selected question). */
export async function resetTeamStageProgress(input: {
  teamId: string;
  teamName: string;
  stage: AdminStageKey;
  reason: string;
}): Promise<void> {
  const ref = teamStateRef(MAIN_COMPETITION_ID, input.teamId);
  const patch: Record<string, unknown> = { updatedAt: serverTimestamp() };

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

  await runTransaction(firestore, async (transaction) => {
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists()) {
      throw new Error("الفريق غير موجود.");
    }
    transaction.update(ref, patch);
  });

  await appendAuditLog({
    type: "progress_reset",
    teamId: input.teamId,
    teamName: input.teamName,
    stage: input.stage,
    reason: input.reason,
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
    const batch = writeBatch(firestore);
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

  await appendAuditLog({ type: "reset_all_scores", reason, teamCount: docs.length });
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
    const batch = writeBatch(firestore);
    chunk.forEach((docSnap) => batch.update(docSnap.ref, patch));
    await batch.commit();
  }

  await updateDoc(gameFlowRef, {
    status: STAGE_INTRO_STATUS[stage],
    currentStage: stage,
    updatedAt: serverTimestamp(),
  });

  await appendAuditLog({
    type: "migrate_all_teams",
    stage,
    reason,
    teamCount: docs.length,
  });
  return docs.length;
}

/** Update a team's display name and/or governorate in teamState + teams doc. */
export async function updateTeamProfile(input: {
  teamId: string;
  teamName: string;
  governorate: string;
  reason: string;
}): Promise<void> {
  const stateRef = teamStateRef(MAIN_COMPETITION_ID, input.teamId);
  const profileRef = teamRef(input.teamId);

  await runTransaction(firestore, async (transaction) => {
    const stateSnapshot = await transaction.get(stateRef);
    if (!stateSnapshot.exists()) {
      throw new Error("الفريق غير موجود في المسابقة.");
    }

    transaction.update(stateRef, {
      teamName: input.teamName.trim(),
      governorate: input.governorate.trim(),
      updatedAt: serverTimestamp(),
    });

    const profileSnapshot = await transaction.get(profileRef);
    if (profileSnapshot.exists()) {
      transaction.update(profileRef, {
        teamName: input.teamName.trim(),
        governorate: input.governorate.trim(),
      });
    }
  });

  await appendAuditLog({
    type: "update_team_profile",
    teamId: input.teamId,
    teamName: input.teamName,
    governorate: input.governorate,
    reason: input.reason,
  });
}

/**
 * Remove a team from the active competition (deletes teamState only).
 * The Firebase Auth account remains; the team can re-register if needed.
 */
export async function removeTeamFromCompetition(input: {
  teamId: string;
  teamName: string;
  reason: string;
}): Promise<void> {
  const stateRef = teamStateRef(MAIN_COMPETITION_ID, input.teamId);

  await runTransaction(firestore, async (transaction) => {
    const snapshot = await transaction.get(stateRef);
    if (!snapshot.exists()) {
      throw new Error("الفريق غير موجود في المسابقة.");
    }
    transaction.delete(stateRef);
  });

  await appendAuditLog({
    type: "remove_team",
    teamId: input.teamId,
    teamName: input.teamName,
    reason: input.reason,
  });
}

/** Update team profile including players list and login email on teams doc. */
export async function updateTeamFullProfile(input: {
  teamId: string;
  teamName: string;
  governorate: string;
  players: TeamPlayer[];
  email: string;
  reason: string;
}): Promise<void> {
  const stateRef = teamStateRef(MAIN_COMPETITION_ID, input.teamId);
  const profileRef = teamRef(input.teamId);

  await runTransaction(firestore, async (transaction) => {
    const stateSnapshot = await transaction.get(stateRef);
    if (!stateSnapshot.exists()) {
      throw new Error("الفريق غير موجود في المسابقة.");
    }

    transaction.update(stateRef, {
      teamName: input.teamName.trim(),
      governorate: input.governorate.trim(),
      updatedAt: serverTimestamp(),
    });

    const profileSnapshot = await transaction.get(profileRef);
    if (profileSnapshot.exists()) {
      transaction.update(profileRef, {
        teamName: input.teamName.trim(),
        governorate: input.governorate.trim(),
        email: input.email.trim(),
        players: input.players,
      });
    }
  });

  await appendAuditLog({
    type: "update_team_profile",
    teamId: input.teamId,
    teamName: input.teamName,
    email: input.email,
    reason: input.reason,
  });
}

/** Set stage lock flags on one team or every registered team when teamId is null. */
export async function setTeamStageLocks(input: {
  teamId: string | null;
  locks: TeamStageLocks;
  reason: string;
}): Promise<number> {
  const patch = {
    stageLocks: { ...input.locks },
    updatedAt: serverTimestamp(),
  };

  if (input.teamId) {
    await updateDoc(teamStateRef(MAIN_COMPETITION_ID, input.teamId), patch);
    await appendAuditLog({
      type: "set_stage_locks",
      teamId: input.teamId,
      locks: input.locks,
      reason: input.reason,
    });
    return 1;
  }

  const snapshot = await getDocs(teamStatesCollectionRef(MAIN_COMPETITION_ID));
  const docs = snapshot.docs;

  for (let index = 0; index < docs.length; index += FIRESTORE_BATCH_LIMIT) {
    const chunk = docs.slice(index, index + FIRESTORE_BATCH_LIMIT);
    const batch = writeBatch(firestore);
    chunk.forEach((docSnap) => batch.update(docSnap.ref, patch));
    await batch.commit();
  }

  await appendAuditLog({
    type: "set_stage_locks_all",
    locks: input.locks,
    reason: input.reason,
    teamCount: docs.length,
  });
  return docs.length;
}

/** Toggle a single stage lock for one team or all teams. */
export async function toggleTeamStageLock(input: {
  teamId: string | null;
  stage: AdminStageKey;
  locked: boolean;
  reason: string;
}): Promise<number> {
  const patch = {
    [`stageLocks.${input.stage}`]: input.locked,
    updatedAt: serverTimestamp(),
  };

  if (input.teamId) {
    const ref = teamStateRef(MAIN_COMPETITION_ID, input.teamId);
    const snapshot = await getDoc(ref);
    if (!snapshot.exists()) {
      throw new Error("الفريق غير موجود.");
    }
    await updateDoc(ref, patch);
    await appendAuditLog({
      type: "set_stage_locks",
      teamId: input.teamId,
      stage: input.stage,
      locked: input.locked,
      reason: input.reason,
    });
    return 1;
  }

  const snapshot = await getDocs(teamStatesCollectionRef(MAIN_COMPETITION_ID));
  const docs = snapshot.docs;

  for (let index = 0; index < docs.length; index += FIRESTORE_BATCH_LIMIT) {
    const chunk = docs.slice(index, index + FIRESTORE_BATCH_LIMIT);
    const batch = writeBatch(firestore);
    chunk.forEach((docSnap) => batch.update(docSnap.ref, patch));
    await batch.commit();
  }

  await appendAuditLog({
    type: "set_stage_locks_all",
    stage: input.stage,
    locked: input.locked,
    reason: input.reason,
    teamCount: docs.length,
  });
  return docs.length;
}

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

  await appendAuditLog({
    type: "team_override",
    teamId: input.teamId,
    teamName: input.teamName,
    status: input.status,
    reason: input.reason,
  });
}

export async function clearTeamFacilitatorOverride(input: {
  teamId: string;
  teamName: string;
  reason: string;
}): Promise<void> {
  await updateDoc(teamStateRef(MAIN_COMPETITION_ID, input.teamId), {
    facilitatorOverride: null,
    updatedAt: serverTimestamp(),
  });

  await appendAuditLog({
    type: "clear_team_override",
    teamId: input.teamId,
    teamName: input.teamName,
    reason: input.reason,
  });
}

/** Delete a team's answers, optionally filtered by stage. */
export async function deleteTeamAnswers(input: {
  teamId: string;
  teamName: string;
  stage: AdminStageKey | "all";
  reason: string;
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
    const batch = writeBatch(firestore);
    chunk.forEach((ref) => batch.delete(ref));
    await batch.commit();
  }

  await appendAuditLog({
    type: "delete_team_answers",
    teamId: input.teamId,
    teamName: input.teamName,
    stage: input.stage,
    deletedCount: refs.length,
    reason: input.reason,
  });

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
  await deleteTeamAnswers({
    teamId: input.teamId,
    teamName: input.teamName,
    stage: "all",
    reason: input.reason,
  });

  await setDoc(
    teamStateRef(MAIN_COMPETITION_ID, input.teamId),
    buildInitialTeamStateDocument(input.teamId, input.teamName, input.governorate),
  );

  await appendAuditLog({
    type: "reset_team_competition_data",
    teamId: input.teamId,
    teamName: input.teamName,
    reason: input.reason,
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
    const batch = writeBatch(firestore);
    chunk.forEach((ref) => batch.delete(ref));
    await batch.commit();
  }

  const stateRef = teamStateRef(MAIN_COMPETITION_ID, input.teamId);
  const profileRef = teamRef(input.teamId);

  await runTransaction(firestore, async (transaction) => {
    const stateSnapshot = await transaction.get(stateRef);
    if (stateSnapshot.exists()) {
      transaction.delete(stateRef);
    }

    const profileSnapshot = await transaction.get(profileRef);
    if (profileSnapshot.exists()) {
      transaction.delete(profileRef);
    }
  });

  await appendAuditLog({
    type: "delete_team_completely",
    teamId: input.teamId,
    teamName: input.teamName,
    deletedAnswers: answerRefs.length,
    reason: input.reason,
  });
}

export function readTeamStageLocks(raw: unknown): TeamStageLocks {
  const parsed = (raw ?? DEFAULT_TEAM_STAGE_LOCKS) as Partial<TeamStageLocks>;
  return {
    stage1: parsed.stage1 === true,
    stage2: parsed.stage2 === true,
    stage3: parsed.stage3 === true,
    stage4: parsed.stage4 === true,
  };
}

export { parseTeamFacilitatorOverride };
