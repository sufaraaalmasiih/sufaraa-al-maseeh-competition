import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { getClientFirestore, firebaseAuth } from "@/firebase/firebaseClient";
import { MAIN_COMPETITION_ID } from "@/firebase/firestore";
import { appendActiveSessionEditLog } from "@/features/facilitator/competition-session";
import { getFacilitatorActorName } from "@/features/facilitator/facilitator-actor";

export const FIRESTORE_BATCH_LIMIT = 500;

/** Maps audit log `type` to canonical edit-log action ids. */
const AUDIT_ACTION_ALIASES: Record<string, string> = {
  score_adjust: "adjust_team_score",
  score_set: "set_team_scores",
  progress_reset: "reset_team_stage_progress",
  remove_team: "remove_team_from_competition",
  set_stage_locks: "toggle_team_stage_lock",
  set_stage_locks_all: "toggle_team_stage_lock_all",
  team_override: "set_team_facilitator_override",
  clear_team_override: "clear_team_facilitator_override",
  migrate_all_teams: "migrate_all_teams_stage",
};

function auditLogCollection() {
  return collection(getClientFirestore(), "competitions", MAIN_COMPETITION_ID, "auditLog");
}

/** Best-effort audit trail. Never blocks the primary mutation. */
export async function appendTeamAdminAuditLog(entry: Record<string, unknown>): Promise<void> {
  const rawType = String(entry.type ?? "unknown");
  const action = AUDIT_ACTION_ALIASES[rawType] ?? rawType;

  try {
    await addDoc(auditLogCollection(), {
      ...entry,
      actorUid: firebaseAuth.currentUser?.uid ?? null,
      actorName: getFacilitatorActorName(),
      createdAt: serverTimestamp(),
    });
    await appendActiveSessionEditLog({
      action,
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
