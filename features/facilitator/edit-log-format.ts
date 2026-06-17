import type { ArchiveTeam, SessionEditLogEntry } from "@/features/facilitator/competition-session";
import { STAGE_OPTIONS_LABELS } from "@/features/facilitator/facilitator-controls-copy";
import type { AdminStageKey } from "@/features/facilitator/facilitator-team-admin";

export const EDIT_LOG_ACTION_LABELS: Record<string, string> = {
  session_started: "بدء المسابقة",
  results_saved: "حفظ النتائج",
  session_metadata_updated: "تعديل بيانات السجل",
  session_results_updated: "تعديل النتائج",
  session_deleted: "حذف السجل",
  adjust_team_score: "تعديل نقاط",
  score_adjust: "تعديل نقاط",
  update_team_profile: "تعديل بيانات فريق",
  reset_all_scores: "تصفير النقاط",
  reset_team_stage_progress: "تصفير تقدم مرحلة",
  progress_reset: "تصفير تقدم مرحلة",
  toggle_team_stage_lock: "قفل/فتح مرحلة",
  toggle_team_stage_lock_all: "قفل/فتح مرحلة (الكل)",
  set_stage_locks: "قفل/فتح مرحلة",
  set_stage_locks_all: "قفل/فتح مرحلة (الكل)",
  set_team_facilitator_override: "انتقال استثنائي",
  team_override: "انتقال استثنائي",
  clear_team_facilitator_override: "إلغاء انتقال استثنائي",
  clear_team_override: "إلغاء انتقال استثنائي",
  delete_team_answers: "حذف إجابات",
  reset_team_competition_data: "تصفير بيانات فريق",
  delete_team_completely: "حذف فريق",
  migrate_all_teams_stage: "نقل جميع الفرق",
  migrate_all_teams: "نقل جميع الفرق",
  remove_team_from_competition: "إزالة فريق",
  remove_team: "إزالة فريق",
};

const STAGE_SCORE_LABELS: Record<string, string> = {
  stage1: STAGE_OPTIONS_LABELS.stage1,
  stage2: STAGE_OPTIONS_LABELS.stage2,
  stage3: STAGE_OPTIONS_LABELS.stage3,
  stage4: STAGE_OPTIONS_LABELS.stage4,
  total: "المجموع",
  rank: "المركز",
  teamName: "اسم الفريق",
  governorate: "المحافظة",
};

const ADMIN_STAGE_LABELS: Record<string, string> = {
  stage1: STAGE_OPTIONS_LABELS.stage1,
  stage2: STAGE_OPTIONS_LABELS.stage2,
  stage3: STAGE_OPTIONS_LABELS.stage3,
  stage4: STAGE_OPTIONS_LABELS.stage4,
  all: "كل المراحل",
};

export type EditLogChangeItem = {
  label: string;
  before?: string;
  after?: string;
  note?: string;
  teamName?: string;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function formatPrimitive(value: unknown): string {
  if (value === null || value === undefined || value === "") {
    return "—";
  }
  if (typeof value === "boolean") {
    return value ? "مفعّل" : "معطّل";
  }
  if (typeof value === "number") {
    return String(value);
  }
  return String(value);
}

function stageDisplayName(stageKey: unknown): string {
  if (typeof stageKey !== "string") {
    return "—";
  }
  return ADMIN_STAGE_LABELS[stageKey] ?? stageKey;
}

function diffObjectFieldsToItems(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
  labels: Record<string, string>,
  teamName?: string,
): EditLogChangeItem[] {
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  const items: EditLogChangeItem[] = [];

  keys.forEach((key) => {
    const prev = before[key];
    const next = after[key];
    if (JSON.stringify(prev) === JSON.stringify(next)) {
      return;
    }
    items.push({
      label: labels[key] ?? key,
      before: formatPrimitive(prev),
      after: formatPrimitive(next),
      teamName,
    });
  });

  return items;
}

function diffArchiveTeams(beforeRaw: unknown, afterRaw: unknown): EditLogChangeItem[] {
  const before = Array.isArray(beforeRaw) ? (beforeRaw as ArchiveTeam[]) : [];
  const after = Array.isArray(afterRaw) ? (afterRaw as ArchiveTeam[]) : [];
  const beforeMap = new Map(before.map((team) => [team.teamId, team]));
  const afterMap = new Map(after.map((team) => [team.teamId, team]));
  const items: EditLogChangeItem[] = [];

  after.forEach((team) => {
    const prev = beforeMap.get(team.teamId);
    if (!prev) {
      items.push({
        label: "إضافة فريق",
        note: `فريق جديد: ${team.teamName} — المجموع ${team.total} — المركز ${team.rank || "—"}`,
        teamName: team.teamName,
      });
      return;
    }

    if (prev.teamName !== team.teamName) {
      items.push({
        label: STAGE_SCORE_LABELS.teamName,
        before: prev.teamName,
        after: team.teamName,
        teamName: team.teamName,
      });
    }
    if (prev.governorate !== team.governorate) {
      items.push({
        label: STAGE_SCORE_LABELS.governorate,
        before: prev.governorate,
        after: team.governorate,
        teamName: team.teamName,
      });
    }
    (["stage1", "stage2", "stage3", "stage4", "total"] as const).forEach((key) => {
      if (prev[key] !== team[key]) {
        items.push({
          label: STAGE_SCORE_LABELS[key],
          before: String(prev[key]),
          after: String(team[key]),
          teamName: team.teamName,
        });
      }
    });
    if (prev.rank !== team.rank) {
      items.push({
        label: STAGE_SCORE_LABELS.rank,
        before: prev.rank ? String(prev.rank) : "—",
        after: team.rank ? String(team.rank) : "—",
        teamName: team.teamName,
      });
    }
  });

  before.forEach((team) => {
    if (!afterMap.has(team.teamId)) {
      items.push({
        label: "حذف فريق",
        note: `حُذف ${team.teamName} من السجل (المجموع السابق ${team.total})`,
        teamName: team.teamName,
      });
    }
  });

  if (items.length === 0 && before.length === after.length) {
    items.push({
      label: "ملاحظة",
      note: "لا توجد تغييرات في النقاط أو الأسماء — ربما أُعيد حساب الترتيب فقط.",
    });
  }

  return items;
}

function formatFromDetails(action: string, details: Record<string, unknown>): EditLogChangeItem[] {
  const items: EditLogChangeItem[] = [];

  if (typeof details.stage === "string") {
    items.push({ label: "المرحلة", note: stageDisplayName(details.stage) });
  }
  if (typeof details.delta === "number") {
    items.push({
      label: "التعديل",
      note: `${details.delta > 0 ? "+" : ""}${details.delta} نقطة`,
    });
  }
  if (typeof details.status === "string") {
    items.push({ label: "الشاشة", note: details.status });
  }
  if (typeof details.locked === "boolean") {
    items.push({ label: "القفل", note: details.locked ? "مقفول" : "مفتوح" });
  }
  if (typeof details.deletedCount === "number") {
    items.push({ label: "عدد الإجابات المحذوفة", note: String(details.deletedCount) });
  }
  if (typeof details.deletedAnswers === "number") {
    items.push({ label: "عدد الإجابات المحذوفة", note: String(details.deletedAnswers) });
  }
  if (typeof details.teamCount === "number") {
    items.push({ label: "عدد الفرق المتأثرة", note: String(details.teamCount) });
  }
  if (typeof details.email === "string" && action.includes("profile")) {
    items.push({ label: "البريد", note: details.email });
  }
  if (typeof details.mode === "string") {
    items.push({
      label: "طريقة الحفظ",
      note: details.mode === "auto" ? "تلقائي" : "يدوي",
    });
  }

  return items;
}

export function getEditLogActionLabel(action: string): string {
  return EDIT_LOG_ACTION_LABELS[action] ?? action;
}

export function formatEditLogChanges(entry: SessionEditLogEntry): EditLogChangeItem[] {
  const before = entry.beforeValue;
  const after = entry.afterValue;

  if (entry.action === "session_results_updated" || entry.action === "results_saved") {
    return diffArchiveTeams(before, after);
  }

  if (entry.action === "session_metadata_updated") {
    const beforeRecord = asRecord(before);
    const afterRecord = asRecord(after);
    if (beforeRecord && afterRecord) {
      return diffObjectFieldsToItems(beforeRecord, afterRecord, {
        title: "العنوان",
        version: "النسخة",
        hostGovernorate: "المحافظة",
      });
    }
  }

  if (entry.action === "adjust_team_score" || entry.action === "score_adjust") {
    const beforeRecord = asRecord(before);
    const afterRecord = asRecord(after);
    if (beforeRecord && afterRecord) {
      const stage = String(beforeRecord.stage ?? afterRecord.stage ?? "");
      const stageLabel = stageDisplayName(stage);
      return [
        {
          label: stageLabel,
          before: formatPrimitive(beforeRecord.stageScore),
          after: formatPrimitive(afterRecord.stageScore),
          teamName: entry.teamName ?? undefined,
        },
        {
          label: STAGE_SCORE_LABELS.total,
          before: formatPrimitive(beforeRecord.totalScore),
          after: formatPrimitive(afterRecord.totalScore),
          teamName: entry.teamName ?? undefined,
        },
      ];
    }
  }

  if (entry.action === "update_team_profile") {
    const beforeRecord = asRecord(before);
    const afterRecord = asRecord(after);
    if (beforeRecord && afterRecord) {
      return diffObjectFieldsToItems(
        beforeRecord,
        afterRecord,
        {
          teamName: "اسم الفريق",
          governorate: "المحافظة",
          email: "البريد",
        },
        entry.teamName ?? undefined,
      );
    }
  }

  if (
    entry.action === "toggle_team_stage_lock" ||
    entry.action === "set_stage_locks" ||
    entry.action === "toggle_team_stage_lock_all" ||
    entry.action === "set_stage_locks_all"
  ) {
    const beforeRecord = asRecord(before);
    const afterRecord = asRecord(after);
    if (beforeRecord && afterRecord) {
      if (beforeRecord.locks && afterRecord.locks) {
        const beforeLocks = asRecord(beforeRecord.locks);
        const afterLocks = asRecord(afterRecord.locks);
        if (beforeLocks && afterLocks) {
          return diffObjectFieldsToItems(
            beforeLocks,
            afterLocks,
            ADMIN_STAGE_LABELS,
            entry.teamName ?? undefined,
          );
        }
      }
      const stage = String(beforeRecord.stage ?? afterRecord.stage ?? "");
      return [
        {
          label: stageDisplayName(stage),
          before: formatPrimitive(beforeRecord.locked),
          after: formatPrimitive(afterRecord.locked),
          teamName: entry.teamName ?? undefined,
        },
      ];
    }
  }

  if (entry.action === "reset_team_stage_progress" || entry.action === "progress_reset") {
    const beforeRecord = asRecord(before);
    const afterRecord = asRecord(after);
    if (beforeRecord && afterRecord) {
      const stage = String(beforeRecord.stage ?? afterRecord.stage ?? "");
      const progressLabels: Record<string, string> = {
        stage1QuestionIndex: `سؤال (${STAGE_OPTIONS_LABELS.stage1})`,
        stage2QuestionIndex: `سؤال (${STAGE_OPTIONS_LABELS.stage2})`,
        stage2Field: `مجال (${STAGE_OPTIONS_LABELS.stage2})`,
        stage3SelectedQuestionId: `سؤال (${STAGE_OPTIONS_LABELS.stage3})`,
        stage4QuestionIndex: `سؤال (${STAGE_OPTIONS_LABELS.stage4})`,
      };
      return diffObjectFieldsToItems(
        beforeRecord,
        afterRecord,
        progressLabels,
        entry.teamName ?? undefined,
      ).filter((item) => item.label !== "stage");
    }
  }

  if (entry.action === "migrate_all_teams_stage" || entry.action === "migrate_all_teams") {
    const beforeRecord = asRecord(before);
    const afterRecord = asRecord(after);
    if (beforeRecord && afterRecord) {
      return [
        {
          label: "المرحلة",
          before: stageDisplayName(beforeRecord.stage),
          after: stageDisplayName(afterRecord.stage),
        },
        {
          label: "عدد الفرق",
          before: formatPrimitive(beforeRecord.teamCount),
          after: formatPrimitive(afterRecord.teamCount),
        },
      ];
    }
  }

  if (entry.action === "delete_team_answers") {
    const beforeRecord = asRecord(before);
    const afterRecord = asRecord(after);
    if (beforeRecord && afterRecord) {
      const stage = String(beforeRecord.stage ?? afterRecord.stage ?? "all");
      return [
        {
          label: stageDisplayName(stage),
          before: `${formatPrimitive(beforeRecord.answerCount)} إجابة`,
          after: `${formatPrimitive(afterRecord.answerCount)} إجابة`,
          teamName: entry.teamName ?? undefined,
        },
      ];
    }
  }

  if (entry.action === "reset_all_scores") {
    const afterRecord = asRecord(after);
    if (afterRecord) {
      return [
        {
          label: "عدد الفرق",
          note: formatPrimitive(afterRecord.teamCount),
        },
        ...(["stage1", "stage2", "stage3", "stage4"] as AdminStageKey[]).map((key) => ({
          label: STAGE_OPTIONS_LABELS[key],
          before: "—",
          after: formatPrimitive(afterRecord[key]),
        })),
        {
          label: STAGE_SCORE_LABELS.total,
          before: "—",
          after: formatPrimitive(afterRecord.total),
        },
      ];
    }
  }

  if (entry.action === "remove_team_from_competition" || entry.action === "remove_team") {
    const beforeRecord = asRecord(before);
    if (beforeRecord) {
      return [
        {
          label: "الفريق",
          before: `${formatPrimitive(beforeRecord.teamName)} (المجموع ${formatPrimitive(beforeRecord.totalScore)})`,
          after: "مُزال",
          teamName: entry.teamName ?? undefined,
        },
      ];
    }
  }

  if (entry.action === "delete_team_completely") {
    const beforeRecord = asRecord(before);
    const afterRecord = asRecord(after);
    if (beforeRecord && afterRecord) {
      return [
        {
          label: "الفريق",
          before: formatPrimitive(beforeRecord.teamName),
          after: "محذوف",
          teamName: entry.teamName ?? undefined,
        },
        {
          label: "الإجابات المحذوفة",
          note: formatPrimitive(afterRecord.deletedAnswers),
          teamName: entry.teamName ?? undefined,
        },
      ];
    }
  }

  if (entry.action === "reset_team_competition_data") {
    const beforeRecord = asRecord(before);
    const afterRecord = asRecord(after);
    if (beforeRecord && afterRecord) {
      const beforeScores = asRecord(beforeRecord.stageScores);
      const items: EditLogChangeItem[] = [
        {
          label: STAGE_SCORE_LABELS.total,
          before: formatPrimitive(beforeRecord.totalScore),
          after: formatPrimitive(afterRecord.totalScore),
          teamName: entry.teamName ?? undefined,
        },
      ];
      if (beforeScores) {
        (["stage1", "stage2", "stage3", "stage4"] as AdminStageKey[]).forEach((key) => {
          items.push({
            label: STAGE_OPTIONS_LABELS[key],
            before: formatPrimitive(beforeScores[key]),
            after: "0",
            teamName: entry.teamName ?? undefined,
          });
        });
      }
      return items;
    }
  }

  if (
    entry.action === "set_team_facilitator_override" ||
    entry.action === "team_override" ||
    entry.action === "clear_team_facilitator_override" ||
    entry.action === "clear_team_override"
  ) {
    const beforeRecord = asRecord(before);
    const afterRecord = asRecord(after);
    if (beforeRecord && afterRecord) {
      return [
        {
          label: "الشاشة",
          before: formatPrimitive(beforeRecord.status),
          after: formatPrimitive(afterRecord.status),
          teamName: entry.teamName ?? undefined,
        },
      ];
    }
  }

  if (before !== null && before !== undefined && after !== null && after !== undefined) {
    const beforeRecord = asRecord(before);
    const afterRecord = asRecord(after);
    if (beforeRecord && afterRecord) {
      const generic = diffObjectFieldsToItems(
        beforeRecord,
        afterRecord,
        STAGE_SCORE_LABELS,
        entry.teamName ?? undefined,
      );
      if (generic.length > 0) {
        return generic;
      }
    }
  }

  if (entry.details && typeof entry.details === "object") {
    return formatFromDetails(entry.action, entry.details as Record<string, unknown>);
  }

  return [];
}

/** @deprecated استخدم formatEditLogChanges للعرض المنظّم */
export function formatEditLogChangeLines(entry: SessionEditLogEntry): string[] {
  return formatEditLogChanges(entry).map((item) => {
    if (item.note) {
      return `${item.label}: ${item.note}`;
    }
    return `${item.label}: ${item.before ?? "—"} ← ${item.after ?? "—"}`;
  });
}
