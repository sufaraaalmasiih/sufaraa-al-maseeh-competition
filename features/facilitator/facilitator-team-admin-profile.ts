import { runTransaction, serverTimestamp } from "firebase/firestore";
import { getClientFirestore } from "@/firebase/firebaseClient";
import { MAIN_COMPETITION_ID, teamRef, teamStateRef } from "@/firebase/firestore";
import { appendTeamAdminAuditLog } from "@/features/facilitator/facilitator-team-admin-audit";
import type { TeamPlayer } from "@/types";

/** Update a team's display name and/or governorate in teamState + teams doc. */
export async function updateTeamProfile(input: {
  teamId: string;
  teamName: string;
  governorate: string;
  reason: string;
}): Promise<void> {
  const stateRef = teamStateRef(MAIN_COMPETITION_ID, input.teamId);
  const profileRef = teamRef(input.teamId);
  let beforeValue: Record<string, unknown> | null = null;

  await runTransaction(getClientFirestore(), async (transaction) => {
    const stateSnapshot = await transaction.get(stateRef);
    if (!stateSnapshot.exists()) {
      throw new Error("الفريق غير موجود في المسابقة.");
    }

    const stateData = stateSnapshot.data();
    beforeValue = {
      teamName: typeof stateData.teamName === "string" ? stateData.teamName : "",
      governorate: typeof stateData.governorate === "string" ? stateData.governorate : "",
    };

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

  await appendTeamAdminAuditLog({
    type: "update_team_profile",
    teamId: input.teamId,
    teamName: input.teamName,
    governorate: input.governorate,
    reason: input.reason,
    beforeValue,
    afterValue: {
      teamName: input.teamName.trim(),
      governorate: input.governorate.trim(),
    },
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
  let beforeValue: Record<string, unknown> | null = null;

  await runTransaction(getClientFirestore(), async (transaction) => {
    const snapshot = await transaction.get(stateRef);
    if (!snapshot.exists()) {
      throw new Error("الفريق غير موجود في المسابقة.");
    }

    const data = snapshot.data();
    beforeValue = {
      teamName: typeof data.teamName === "string" ? data.teamName : input.teamName,
      governorate: typeof data.governorate === "string" ? data.governorate : "",
      totalScore: typeof data.totalScore === "number" ? data.totalScore : 0,
    };
    transaction.delete(stateRef);
  });

  await appendTeamAdminAuditLog({
    type: "remove_team",
    teamId: input.teamId,
    teamName: input.teamName,
    reason: input.reason,
    beforeValue,
    afterValue: { removed: true },
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
  let beforeValue: Record<string, unknown> | null = null;

  await runTransaction(getClientFirestore(), async (transaction) => {
    const stateSnapshot = await transaction.get(stateRef);
    const profileSnapshot = await transaction.get(profileRef);

    // قد لا تكون حالة المسابقة موجودة (فريق لم يعد للدخول بعد بدء مسابقة جديدة) —
    // نحدّث ملف الفريق على أي حال، والحالة فقط إن وُجدت.
    if (!stateSnapshot.exists() && !profileSnapshot.exists()) {
      throw new Error("الفريق غير موجود.");
    }

    const stateData = stateSnapshot.exists() ? stateSnapshot.data() : null;
    const profileData = profileSnapshot.exists() ? profileSnapshot.data() : null;

    beforeValue = {
      teamName:
        (typeof stateData?.teamName === "string" ? stateData.teamName : null) ??
        (typeof profileData?.teamName === "string" ? profileData.teamName : ""),
      governorate:
        (typeof stateData?.governorate === "string" ? stateData.governorate : null) ??
        (typeof profileData?.governorate === "string" ? profileData.governorate : ""),
      email: typeof profileData?.email === "string" ? profileData.email : "",
    };

    if (stateSnapshot.exists()) {
      transaction.update(stateRef, {
        teamName: input.teamName.trim(),
        governorate: input.governorate.trim(),
        updatedAt: serverTimestamp(),
      });
    }

    if (profileSnapshot.exists()) {
      transaction.update(profileRef, {
        teamName: input.teamName.trim(),
        governorate: input.governorate.trim(),
        email: input.email.trim(),
        players: input.players,
      });
    }
  });

  await appendTeamAdminAuditLog({
    type: "update_team_profile",
    teamId: input.teamId,
    teamName: input.teamName,
    email: input.email,
    reason: input.reason,
    beforeValue,
    afterValue: {
      teamName: input.teamName.trim(),
      governorate: input.governorate.trim(),
      email: input.email.trim(),
    },
  });
}
