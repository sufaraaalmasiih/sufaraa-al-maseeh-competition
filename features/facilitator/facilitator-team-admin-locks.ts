import { getDoc, getDocs, serverTimestamp, updateDoc, writeBatch } from "firebase/firestore";
import { firestore } from "@/firebase/firebaseClient";
import { MAIN_COMPETITION_ID, teamStateRef, teamStatesCollectionRef } from "@/firebase/firestore";
import {
  appendTeamAdminAuditLog,
  FIRESTORE_BATCH_LIMIT,
} from "@/features/facilitator/facilitator-team-admin-audit";
import {
  DEFAULT_TEAM_STAGE_LOCKS,
  type AdminStageKey,
  type TeamStageLocks,
} from "@/features/facilitator/team-control-types";

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
    const ref = teamStateRef(MAIN_COMPETITION_ID, input.teamId);
    const snapshot = await getDoc(ref);
    if (!snapshot.exists()) {
      throw new Error("الفريق غير موجود.");
    }
    const beforeLocks = readTeamStageLocks(snapshot.data()?.stageLocks);
    await updateDoc(ref, patch);
    await appendTeamAdminAuditLog({
      type: "set_stage_locks",
      teamId: input.teamId,
      locks: input.locks,
      reason: input.reason,
      beforeValue: { locks: beforeLocks },
      afterValue: { locks: input.locks },
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

  await appendTeamAdminAuditLog({
    type: "set_stage_locks_all",
    locks: input.locks,
    reason: input.reason,
    teamCount: docs.length,
    beforeValue: { scope: "all_teams", note: "قفل مراحل مختلف بين الفرق" },
    afterValue: { locks: input.locks, teamCount: docs.length },
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
    const beforeLocks = readTeamStageLocks(snapshot.data()?.stageLocks);
    await updateDoc(ref, patch);
    await appendTeamAdminAuditLog({
      type: "set_stage_locks",
      teamId: input.teamId,
      stage: input.stage,
      locked: input.locked,
      reason: input.reason,
      beforeValue: { stage: input.stage, locked: beforeLocks[input.stage] },
      afterValue: { stage: input.stage, locked: input.locked },
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

  await appendTeamAdminAuditLog({
    type: "set_stage_locks_all",
    stage: input.stage,
    locked: input.locked,
    reason: input.reason,
    teamCount: docs.length,
    beforeValue: { stage: input.stage, note: "حالة قفل مختلفة بين الفرق" },
    afterValue: { stage: input.stage, locked: input.locked, teamCount: docs.length },
  });
  return docs.length;
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
