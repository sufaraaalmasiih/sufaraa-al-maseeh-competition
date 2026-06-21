import type { AdminStageKey } from "@/features/facilitator/team-control-types";

const STAGE_KEYS: AdminStageKey[] = ["stage1", "stage2", "stage3", "stage4"];

/** صف إجابة مبسّط — يكفي لإعادة حساب النقاط التلقائية. */
export interface ScoreAnswerRow {
  teamId: string;
  stage: string;
  pointsDelta: number | null;
}

export type AutoStageScores = Record<AdminStageKey, number>;

function isStageKey(value: string): value is AdminStageKey {
  return (STAGE_KEYS as string[]).includes(value);
}

/**
 * يعيد حساب نقاط الفريق لكل مرحلة من إجاباته المؤكَّدة (مجموع pointsDelta لكل مرحلة)،
 * متجاهلاً أي تعديلات يدوية على النقاط (التعديلات اليدوية لا تنشئ وثائق إجابة).
 * كل مرحلة محصورة بـ ≥ 0 مطابقةً لسلوك الاحتساب الحيّ (النقاط لا تنزل تحت الصفر).
 */
export function recomputeStageScoresFromAnswers(
  rows: ScoreAnswerRow[],
  teamId: string,
): AutoStageScores {
  const totals: AutoStageScores = { stage1: 0, stage2: 0, stage3: 0, stage4: 0 };

  for (const row of rows) {
    if (row.teamId !== teamId) {
      continue;
    }
    if (!isStageKey(row.stage)) {
      continue;
    }
    if (typeof row.pointsDelta !== "number" || !Number.isFinite(row.pointsDelta)) {
      continue;
    }
    totals[row.stage] += row.pointsDelta;
  }

  for (const stage of STAGE_KEYS) {
    totals[stage] = Math.max(0, Math.round(totals[stage]));
  }

  return totals;
}
