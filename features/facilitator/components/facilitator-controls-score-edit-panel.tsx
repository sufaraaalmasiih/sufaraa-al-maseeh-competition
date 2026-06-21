"use client";

import { Sliders } from "lucide-react";
import { STAGE_OPTIONS_LABELS } from "@/features/facilitator/facilitator-controls-copy";
import type { AdminStageKey } from "@/features/facilitator/team-control-types";

export interface ScoreEditValues {
  stage1: string;
  stage2: string;
  stage3: string;
  stage4: string;
}

interface FacilitatorControlsScoreEditPanelProps {
  teamName: string;
  /** القيم الحالية المحفوظة (الافتراضي) لكل مرحلة + المجموع. */
  currentScores: { stage1: number; stage2: number; stage3: number; stage4: number; total: number };
  values: ScoreEditValues;
  onValuesChange: (updater: (current: ScoreEditValues) => ScoreEditValues) => void;
  onResetToAutomatic: () => void;
  onSave: () => void;
  disabled: boolean;
}

const STAGES: AdminStageKey[] = ["stage1", "stage2", "stage3", "stage4"];

export function FacilitatorControlsScoreEditPanel({
  teamName,
  currentScores,
  values,
  onValuesChange,
  onResetToAutomatic,
  onSave,
  disabled,
}: FacilitatorControlsScoreEditPanelProps) {
  const previewTotal = STAGES.reduce((sum, stage) => {
    const raw = Number(values[stage]);
    return sum + (Number.isFinite(raw) && raw > 0 ? Math.round(raw) : 0);
  }, 0);

  return (
    <div className="facilitator-card">
      <div className="facilitator-card__head">
        <Sliders className="h-5 w-5 text-[#2388C4]" aria-hidden />
        <div>
          <h3 className="facilitator-card__title">تعديل نقاط الفريق تفصيلياً</h3>
          <p className="facilitator-card__desc">
            عدّل نقاط «{teamName}» لكل مرحلة. زر «إرجاع للقيم المحسوبة تلقائياً» يعيد احتساب
            النقاط من الإجابات (يتجاهل أي تعديل يدوي سابق). يتطلّب الحفظ كتابة سبب، ويُسجَّل في الأرشيف.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {STAGES.map((stage) => (
          <label key={stage} className="facilitator-field">
            <span className="facilitator-field__label">
              {STAGE_OPTIONS_LABELS[stage]} (الحالي: {currentScores[stage]})
            </span>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              className="facilitator-input"
              value={values[stage]}
              disabled={disabled}
              onChange={(event) =>
                onValuesChange((current) => ({ ...current, [stage]: event.target.value }))
              }
            />
          </label>
        ))}
      </div>

      <p className="mt-3 text-sm font-bold text-[#143A5A]">
        المجموع بعد التعديل: <span className="text-[#2388C4]">{previewTotal}</span>
        <span className="mr-2 text-xs font-semibold text-[#64748B]">
          (الحالي: {currentScores.total})
        </span>
      </p>

      <div className="facilitator-timer__buttons mt-3">
        <button
          type="button"
          className="facilitator-btn facilitator-btn--primary"
          disabled={disabled}
          onClick={onSave}
        >
          حفظ النقاط
        </button>
        <button
          type="button"
          className="facilitator-btn facilitator-btn--outline"
          disabled={disabled}
          onClick={onResetToAutomatic}
        >
          إرجاع للقيم المحسوبة تلقائياً
        </button>
      </div>
    </div>
  );
}
