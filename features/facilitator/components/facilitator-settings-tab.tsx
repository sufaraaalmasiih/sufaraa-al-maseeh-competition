"use client";

import { useEffect, useState } from "react";
import { onSnapshot } from "firebase/firestore";
import { Save } from "lucide-react";
import { gameFlowRef } from "@/firebase/firestore";
import { CompetitionResetPanel } from "@/features/gameflow/components/competition-reset-panel";
import {
  DEFAULT_TIMER_DURATIONS,
  parseTimerDurations,
  writeTimerDurations,
  type FacilitatorTimerDurations,
} from "@/features/facilitator/facilitator-timer-settings";
import { setStage4QuestionCount } from "@/features/stage4/set-stage4-question-count";
import { STAGE4_DEFAULT_QUESTION_COUNT } from "@/features/stage4/stage4-constants";

const FIELDS: { key: keyof FacilitatorTimerDurations; label: string }[] = [
  { key: "stage1", label: "المرحلة الأولى (ثانية)" },
  { key: "stage2Reading", label: "قراءة المرجع (ثانية)" },
  { key: "stage2Turn", label: "مجال المرحلة الثانية (ثانية)" },
  { key: "stage3Selection", label: "اختيار السؤال — على المحك (ثانية)" },
  { key: "stage3Answer", label: "الإجابة — على المحك (ثانية)" },
  { key: "stage3Reveal", label: "الإعلان — على المحك (ثانية)" },
  { key: "stage4Answer", label: "الإجابة — اثبتوا بالحق (ثانية)" },
];

export function FacilitatorSettingsTab() {
  const [durations, setDurations] = useState<FacilitatorTimerDurations>(
    () => ({ ...DEFAULT_TIMER_DURATIONS }),
  );
  const [stage4QuestionCount, setStage4QuestionCountLocal] = useState(
    STAGE4_DEFAULT_QUESTION_COUNT,
  );
  const [dirty, setDirty] = useState(false);
  const [stage4Dirty, setStage4Dirty] = useState(false);
  const [saved, setSaved] = useState(false);
  const [stage4Saved, setStage4Saved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [stage4Saving, setStage4Saving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stage4Error, setStage4Error] = useState<string | null>(null);

  useEffect(() => {
    return onSnapshot(gameFlowRef, (snapshot) => {
      const data = snapshot.data();
      // Don't clobber unsaved edits while the facilitator is typing.
      setDurations((current) =>
        dirty ? current : parseTimerDurations(data?.durations),
      );
      if (!stage4Dirty) {
        const stored = data?.stage4QuestionCount;
        setStage4QuestionCountLocal(
          typeof stored === "number" && Number.isFinite(stored)
            ? stored
            : STAGE4_DEFAULT_QUESTION_COUNT,
        );
      }
    });
  }, [dirty, stage4Dirty]);

  function updateField(key: keyof FacilitatorTimerDurations, value: string) {
    setSaved(false);
    setDirty(true);
    setDurations((current) => ({
      ...current,
      [key]: Number(value) || 0,
    }));
  }

  async function persist(next: FacilitatorTimerDurations) {
    setSaving(true);
    setError(null);
    try {
      await writeTimerDurations(next);
      setDurations(next);
      setDirty(false);
      setSaved(true);
    } catch {
      setError("تعذر حفظ المدد. حاول مرة أخرى.");
    } finally {
      setSaving(false);
    }
  }

  function handleSave() {
    void persist(durations);
  }

  function handleReset() {
    void persist({ ...DEFAULT_TIMER_DURATIONS });
  }

  function updateStage4QuestionCount(value: string) {
    setStage4Saved(false);
    setStage4Dirty(true);
    setStage4QuestionCountLocal(Number(value) || STAGE4_DEFAULT_QUESTION_COUNT);
  }

  async function persistStage4QuestionCount() {
    setStage4Saving(true);
    setStage4Error(null);
    try {
      const safeCount = Math.max(1, Math.min(15, Math.floor(stage4QuestionCount)));
      await setStage4QuestionCount(safeCount);
      setStage4QuestionCountLocal(safeCount);
      setStage4Dirty(false);
      setStage4Saved(true);
    } catch {
      setStage4Error("تعذر حفظ عدد الأسئلة. حاول مرة أخرى.");
    } finally {
      setStage4Saving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="facilitator-card">
        <div className="facilitator-card__head">
          <div>
            <h3 className="facilitator-card__title">مدة المؤقتات</h3>
            <p className="facilitator-card__desc">
              تُحفظ في قاعدة البيانات وتقرأها كل الشاشات (الميسر، المتسابقون،
              الجمهور). تُستخدم عند بدء كل مؤقت في المسابقة.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {FIELDS.map((field) => (
            <label key={field.key} className="facilitator-field">
              <span className="facilitator-field__label">{field.label}</span>
              <input
                type="number"
                min={1}
                className="facilitator-input"
                value={durations[field.key]}
                onChange={(event) => updateField(field.key, event.target.value)}
              />
            </label>
          ))}
        </div>

        <div className="facilitator-timer__buttons">
          <button
            type="button"
            className="facilitator-btn facilitator-btn--primary"
            onClick={handleSave}
            disabled={saving}
          >
            <Save className="h-4 w-4" aria-hidden />
            {saving ? "جارٍ الحفظ..." : "حفظ المدد"}
          </button>
          <button
            type="button"
            className="facilitator-btn facilitator-btn--outline"
            onClick={handleReset}
            disabled={saving}
          >
            استعادة الافتراضي
          </button>
        </div>
        {saved && !dirty ? (
          <p className="facilitator-inline-success">تم حفظ مدد المؤقتات لكل الشاشات.</p>
        ) : null}
        {error ? <p className="facilitator-inline-error">{error}</p> : null}
      </div>

      <div className="facilitator-card">
        <div className="facilitator-card__head">
          <div>
            <h3 className="facilitator-card__title">إعدادات المرحلة الرابعة</h3>
            <p className="facilitator-card__desc">
              عدد أسئلة «اثبتوا بالحق» يُطبَّق عند بدء المرحلة من لوحة سير المسابقة.
            </p>
          </div>
        </div>

        <label className="facilitator-field">
          <span className="facilitator-field__label">عدد أسئلة المرحلة الرابعة</span>
          <input
            type="number"
            min={1}
            max={15}
            className="facilitator-input"
            value={stage4QuestionCount}
            onChange={(event) => updateStage4QuestionCount(event.target.value)}
          />
        </label>

        <div className="facilitator-timer__buttons">
          <button
            type="button"
            className="facilitator-btn facilitator-btn--primary"
            onClick={() => void persistStage4QuestionCount()}
            disabled={stage4Saving}
          >
            <Save className="h-4 w-4" aria-hidden />
            {stage4Saving ? "جارٍ الحفظ..." : "حفظ عدد الأسئلة"}
          </button>
        </div>
        {stage4Saved && !stage4Dirty ? (
          <p className="facilitator-inline-success">تم حفظ عدد أسئلة المرحلة الرابعة.</p>
        ) : null}
        {stage4Error ? <p className="facilitator-inline-error">{stage4Error}</p> : null}
      </div>

      <CompetitionResetPanel />
    </div>
  );
}
