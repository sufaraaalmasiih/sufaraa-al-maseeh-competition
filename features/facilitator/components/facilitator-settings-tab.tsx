"use client";

import { useEffect, useState } from "react";
import { onSnapshot } from "firebase/firestore";
import { Save } from "lucide-react";
import { gameFlowRef } from "@/firebase/firestore";
import {
  DEFAULT_TIMER_DURATIONS,
  parseTimerDurations,
  writeTimerDurations,
  type FacilitatorTimerDurations,
} from "@/features/facilitator/facilitator-timer-settings";
import {
  clampSettingsToBankSizes,
  fetchQuestionBankMeta,
  saveQuestionBankMeta,
  type QuestionBankMeta,
} from "@/features/facilitator/question-bank-meta";
import {
  DEFAULT_QUESTION_DISPLAY_SETTINGS,
  getStageDisplayLabel,
  parseQuestionDisplaySettings,
  STAGE_DISPLAY_KEYS,
  STAGE2_FIELD_KEYS,
  STAGE2_FIELD_LABELS,
  writeQuestionDisplaySettings,
  type QuestionDisplaySettings,
  type QuestionOrderMode,
  type Stage2FieldDisplaySettings,
  type StageQuestionDisplaySettings,
} from "@/features/facilitator/question-display-settings";
import type { AdminStageKey } from "@/features/facilitator/facilitator-team-admin";
import {
  parseCompetitionMode,
  parseTrainingEndsAtMs,
  writeCompetitionMode,
  type CompetitionMode,
} from "@/features/facilitator/competition-mode";
import { CompetitionBootstrapPanel } from "@/features/gameflow/components/competition-bootstrap-panel";

const FIELDS: { key: keyof FacilitatorTimerDurations; label: string }[] = [
  { key: "stage1", label: "المرحلة الأولى (ثانية)" },
  { key: "stage2Reading", label: "قراءة المرجع (ثانية)" },
  { key: "stage2Turn", label: "مجال المرحلة الثانية (ثانية)" },
  { key: "stage3Selection", label: "اختيار السؤال — على المحك (ثانية)" },
  { key: "stage3Answer", label: "الإجابة — على المحك (ثانية)" },
  { key: "stage3Reveal", label: "الإعلان — على المحك (ثانية)" },
  { key: "stage4Selection", label: "اختيار السؤال — اثبتوا بالحق (ثانية)" },
  { key: "stage4Answer", label: "الإجابة — اثبتوا بالحق (ثانية)" },
  { key: "stage4Reveal", label: "الإعلان — اثبتوا بالحق (ثانية)" },
];

const ORDER_OPTIONS: { value: QuestionOrderMode; label: string }[] = [
  { value: "order", label: "ترتيب الميسر (كما في ملف Excel)" },
  { value: "random", label: "ترتيب عشوائي (ثابت لكل مسابقة)" },
];

function msToDatetimeLocal(ms: number): string {
  const date = new Date(ms);
  const pad = (value: number) => value.toString().padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function parseDatetimeLocal(value: string): number | null {
  if (!value) {
    return null;
  }
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export function FacilitatorSettingsTab() {
  const [durations, setDurations] = useState<FacilitatorTimerDurations>(
    () => ({ ...DEFAULT_TIMER_DURATIONS }),
  );
  const [questionSettings, setQuestionSettings] = useState<QuestionDisplaySettings>(
    () => ({ ...DEFAULT_QUESTION_DISPLAY_SETTINGS }),
  );
  const [bankMeta, setBankMeta] = useState<QuestionBankMeta | null>(null);
  const [dirty, setDirty] = useState(false);
  const [questionDirty, setQuestionDirty] = useState(false);
  const [saved, setSaved] = useState(false);
  const [questionSaved, setQuestionSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [questionSaving, setQuestionSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [questionError, setQuestionError] = useState<string | null>(null);
  const [questionClampNotice, setQuestionClampNotice] = useState<string | null>(null);
  const [stage2Reference, setStage2Reference] = useState("يوحنا 15: 1-17");
  const [stage2Passage, setStage2Passage] = useState("");
  const [readingDirty, setReadingDirty] = useState(false);
  const [readingSaved, setReadingSaved] = useState(false);
  const [readingSaving, setReadingSaving] = useState(false);
  const [readingError, setReadingError] = useState<string | null>(null);
  const [competitionMode, setCompetitionMode] = useState<CompetitionMode>("official");
  const [trainingEndsAtInput, setTrainingEndsAtInput] = useState("");
  const [modeDirty, setModeDirty] = useState(false);
  const [modeSaved, setModeSaved] = useState(false);
  const [modeSaving, setModeSaving] = useState(false);
  const [modeError, setModeError] = useState<string | null>(null);

  useEffect(() => {
    void fetchQuestionBankMeta().then((meta) => {
      setBankMeta(meta);
      if (!readingDirty) {
        setStage2Reference(meta.stage2ReadingReference);
        setStage2Passage(meta.stage2ReadingPassage);
      }
    });
  }, [readingDirty]);

  useEffect(() => {
    return onSnapshot(gameFlowRef, (snapshot) => {
      const data = snapshot.data();
      setDurations((current) => (dirty ? current : parseTimerDurations(data?.durations)));
      if (!questionDirty) {
        setQuestionSettings(
          parseQuestionDisplaySettings(data, bankMeta?.bankSizes),
        );
      }
      if (!modeDirty) {
        const mode = parseCompetitionMode(data?.competitionMode);
        setCompetitionMode(mode);
        const endsAt = parseTrainingEndsAtMs(data?.trainingEndsAtMs);
        setTrainingEndsAtInput(endsAt ? msToDatetimeLocal(endsAt) : "");
      }
    });
  }, [dirty, questionDirty, bankMeta, modeDirty]);

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

  function updateStageSetting(
    stage: AdminStageKey,
    patch: Partial<StageQuestionDisplaySettings>,
  ) {
    setQuestionSaved(false);
    setQuestionDirty(true);
    setQuestionSettings((current) => ({
      ...current,
      [stage]: { ...current[stage], ...patch },
    }));
  }

  function updateStage2Field(field: keyof Stage2FieldDisplaySettings, value: number) {
    setQuestionSaved(false);
    setQuestionDirty(true);
    setQuestionSettings((current) => ({
      ...current,
      stage2Fields: { ...current.stage2Fields, [field]: Math.max(1, value || 1) },
    }));
  }

  async function persistQuestionSettings() {
    setQuestionSaving(true);
    setQuestionError(null);
    setQuestionClampNotice(null);
    try {
      // نقرأ أحجام البنك الفعلية الطازجة دائماً من آخر استيراد Excel — مصدر الحقيقة.
      const meta = await fetchQuestionBankMeta();
      setBankMeta(meta);
      const clamped = clampSettingsToBankSizes(questionSettings, meta.bankSizes);

      // رسالة صريحة بكل مرحلة طلب فيها الميسّر أكثر مما في البنك (#1).
      const clampMessages = STAGE_DISPLAY_KEYS.filter(
        (stage) =>
          stage !== "stage2" &&
          questionSettings[stage].displayCount > meta.bankSizes[stage],
      ).map(
        (stage) =>
          `${getStageDisplayLabel(stage)}: طلبت ${questionSettings[stage].displayCount} والبنك فيه ${meta.bankSizes[stage]} فقط`,
      );

      await writeQuestionDisplaySettings(clamped);
      setQuestionSettings(clamped);
      setQuestionDirty(false);
      setQuestionSaved(true);
      if (clampMessages.length > 0) {
        setQuestionClampNotice(
          `حُفظت الإعدادات، لكن قُلِّصت لتطابق البنك — ${clampMessages.join(" · ")}. ` +
            "أضف أسئلة في Excel ثم أعد الاستيراد لرفع العدد.",
        );
      }
    } catch {
      setQuestionError("تعذر حفظ إعدادات الأسئلة. حاول مرة أخرى.");
    } finally {
      setQuestionSaving(false);
    }
  }

  async function persistCompetitionMode() {
    setModeSaving(true);
    setModeError(null);
    try {
      const trainingEndsAtMs =
        competitionMode === "training" ? parseDatetimeLocal(trainingEndsAtInput) : null;

      if (competitionMode === "training" && !trainingEndsAtMs) {
        throw new Error("حدّد وقت انتهاء التدريب.");
      }

      if (competitionMode === "training" && trainingEndsAtMs! <= Date.now()) {
        throw new Error("وقت انتهاء التدريب يجب أن يكون في المستقبل.");
      }

      await writeCompetitionMode({ mode: competitionMode, trainingEndsAtMs });
      setModeDirty(false);
      setModeSaved(true);
    } catch (error) {
      setModeError(
        error instanceof Error ? error.message : "تعذر حفظ وضع المسابقة.",
      );
    } finally {
      setModeSaving(false);
    }
  }

  async function persistStage2Reading() {
    setReadingSaving(true);
    setReadingError(null);
    try {
      await saveQuestionBankMeta({
        stage2ReadingReference: stage2Reference.trim() || "يوحنا 15: 1-17",
        stage2ReadingPassage: stage2Passage.trim(),
      });
      setReadingDirty(false);
      setReadingSaved(true);
      const meta = await fetchQuestionBankMeta();
      setBankMeta(meta);
    } catch {
      setReadingError("تعذر حفظ نص القراءة. حاول مرة أخرى.");
    } finally {
      setReadingSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <CompetitionBootstrapPanel showWhenReady />

      <div className="facilitator-card">
        <div className="facilitator-card__head">
          <div>
            <h3 className="facilitator-card__title">وضع التدريب</h3>
            <p className="facilitator-card__desc">
              في وضع التدريب لا يُنشأ سجل نهائي ولا تُؤرشف الأسئلة عند الاستيراد.
              عند انتهاء الوقت المحدّد تُمسح بيانات المسابقة تلقائياً مع الإبقاء على
              الفرق وبنك الأسئلة.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="facilitator-field">
            <span className="facilitator-field__label">نوع المسابقة</span>
            <select
              className="facilitator-input"
              value={competitionMode}
              onChange={(event) => {
                setModeSaved(false);
                setModeDirty(true);
                setCompetitionMode(event.target.value as CompetitionMode);
              }}
            >
              <option value="official">مسابقة رسمية</option>
              <option value="training">تدريب</option>
            </select>
          </label>

          {competitionMode === "training" ? (
            <label className="facilitator-field">
              <span className="facilitator-field__label">وقت انتهاء التدريب</span>
              <input
                type="datetime-local"
                className="facilitator-input"
                value={trainingEndsAtInput}
                onChange={(event) => {
                  setModeSaved(false);
                  setModeDirty(true);
                  setTrainingEndsAtInput(event.target.value);
                }}
              />
            </label>
          ) : null}
        </div>

        <div className="facilitator-timer__buttons mt-4">
          <button
            type="button"
            className="facilitator-btn facilitator-btn--primary"
            onClick={() => void persistCompetitionMode()}
            disabled={modeSaving}
          >
            <Save className="h-4 w-4" aria-hidden />
            {modeSaving ? "جارٍ الحفظ..." : "حفظ وضع المسابقة"}
          </button>
        </div>
        {modeSaved && !modeDirty ? (
          <p className="facilitator-inline-success">تم حفظ وضع المسابقة.</p>
        ) : null}
        {modeError ? <p className="facilitator-inline-error">{modeError}</p> : null}
      </div>

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
            <h3 className="facilitator-card__title">عدد وترتيب الأسئلة في كل مرحلة</h3>
            <p className="facilitator-card__desc">
              يكتب المشرف كل الأسئلة في ملف Excel (مثلاً Stage1 — 200 سؤال). هنا يحدد
              الميسر كم سؤالاً يظهر في المسابقة وبالترتيب الذي يريده. أسئلة كل مرحلة
              من بنكها فقط — لا تختلط بين المراحل.
            </p>
          </div>
        </div>

        {bankMeta ? (
          <p className="mb-4 text-sm text-[#5A6B7D]">
            أحجام البنوك الحالية من آخر استيراد:{" "}
            {STAGE_DISPLAY_KEYS.map((stage) => (
              <span key={stage} className="ml-2 inline-block">
                {getStageDisplayLabel(stage)} — {bankMeta.bankSizes[stage]}
              </span>
            ))}
          </p>
        ) : null}

        <p className="mb-3 rounded-lg bg-[#EFF6FF] px-3 py-2 text-xs font-semibold text-[#1E40AF]">
          المرحلة الثانية لا عدد إجمالي لها — كل مجال (توصيل/ترتيب الآية/إكمال/صح-خطأ) يُحدَّد
          بعدده الخاص في قسم «عدد أسئلة مجالات المرحلة الثانية» بالأسفل.
        </p>

        <div className="space-y-5">
          {STAGE_DISPLAY_KEYS.filter((stage) => stage !== "stage2").map((stage) => {
            const bankSize = bankMeta?.bankSizes[stage] ?? 50;
            const settings = questionSettings[stage];
            const showOrder = stage !== "stage3";
            const overBank = settings.displayCount > bankSize;
            const overBoard = stage === "stage3" && settings.displayCount > 30;

            return (
              <div
                key={stage}
                className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4"
              >
                <h4 className="mb-3 text-sm font-black text-[#143A5A]">
                  {getStageDisplayLabel(stage)}
                  <span className="mr-2 font-normal text-[#64748B]">
                    (البنك: {bankSize} سؤال)
                  </span>
                </h4>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="facilitator-field">
                    <span className="facilitator-field__label">عدد الأسئلة الظاهرة</span>
                    <input
                      type="number"
                      min={1}
                      max={bankSize}
                      className="facilitator-input"
                      value={settings.displayCount}
                      onChange={(event) =>
                        updateStageSetting(stage, {
                          displayCount: Number(event.target.value) || 1,
                        })
                      }
                    />
                  </label>
                  {showOrder ? (
                    <label className="facilitator-field">
                      <span className="facilitator-field__label">ترتيب الظهور</span>
                      <select
                        className="facilitator-input"
                        value={settings.orderMode}
                        onChange={(event) =>
                          updateStageSetting(stage, {
                            orderMode: event.target.value as QuestionOrderMode,
                          })
                        }
                      >
                        {ORDER_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  ) : (
                    <p className="self-end text-sm text-[#64748B]">
                      المرحلة الثالثة تستخدم لوحة ثابتة؛ العدد يحدد خلايا البنك النشطة.
                    </p>
                  )}
                </div>
                {overBank ? (
                  <p className="mt-2 rounded-lg bg-[#FFF7ED] px-3 py-2 text-xs font-bold text-[#B45309]">
                    ⚠️ العدد المطلوب ({settings.displayCount}) أكبر من عدد أسئلة البنك
                    ({bankSize}). سيُعرض {bankSize} سؤالاً فقط — أضف أسئلة في Excel أو قلّل العدد.
                  </p>
                ) : null}
                {overBoard ? (
                  <p className="mt-2 rounded-lg bg-[#FFF7ED] px-3 py-2 text-xs font-bold text-[#B45309]">
                    ⚠️ لوحة المرحلة الثالثة لا تتجاوز 30 خلية؛ سيُعرض 30 سؤالاً كحدٍّ أقصى.
                  </p>
                ) : null}
              </div>
            );
          })}
        </div>

        <div className="mt-5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
          <h4 className="mb-1 text-sm font-black text-[#143A5A]">
            عدد أسئلة مجالات المرحلة الثانية
          </h4>
          <p className="mb-3 text-xs text-[#64748B]">
            كم يظهر لكل مجال من بنك Excel: «التوصيل» = عدد الجولات (كل جولة حتى 5 أزواج
            في شاشة)، وبقية المجالات = عدد الأسئلة. إن كان البنك أقل، يُعرض المتاح فقط.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {STAGE2_FIELD_KEYS.map((field) => (
              <label key={field} className="facilitator-field">
                <span className="facilitator-field__label">{STAGE2_FIELD_LABELS[field]}</span>
                <input
                  type="number"
                  min={1}
                  max={50}
                  className="facilitator-input"
                  value={questionSettings.stage2Fields[field]}
                  onChange={(event) =>
                    updateStage2Field(field, Number(event.target.value) || 1)
                  }
                />
              </label>
            ))}
          </div>
        </div>

        <div className="facilitator-timer__buttons mt-4">
          <button
            type="button"
            className="facilitator-btn facilitator-btn--primary"
            onClick={() => void persistQuestionSettings()}
            disabled={questionSaving}
          >
            <Save className="h-4 w-4" aria-hidden />
            {questionSaving ? "جارٍ الحفظ..." : "حفظ إعدادات الأسئلة"}
          </button>
        </div>
        {questionSaved && !questionDirty && !questionClampNotice ? (
          <p className="facilitator-inline-success">
            تم حفظ إعدادات الأسئلة. تُطبَّق عند بدء كل مرحلة من لوحة التحكم.
          </p>
        ) : null}
        {questionClampNotice ? (
          <p className="mt-2 rounded-lg bg-[#FFF7ED] px-3 py-2 text-xs font-bold text-[#B45309]">
            ⚠️ {questionClampNotice}
          </p>
        ) : null}
        {questionError ? <p className="facilitator-inline-error">{questionError}</p> : null}
      </div>

      <div className="facilitator-card">
        <div className="facilitator-card__head">
          <div>
            <h3 className="facilitator-card__title">قراءة المرحلة الثانية — فتشوا الكتب</h3>
            <p className="facilitator-card__desc">
              النص الذي يظهر على شاشة القراءة قبل بدء الأسئلة. يمكنك تعديله هنا مباشرة
              أو من ورقة <strong>قراءة المرحلة الثانية</strong> في ملف Excel ثم إعادة الاستيراد.
            </p>
          </div>
        </div>

        <div className="grid gap-4">
          <label className="facilitator-field">
            <span className="facilitator-field__label">المرجع المختصر (يظهر بخط كبير)</span>
            <input
              type="text"
              className="facilitator-input"
              value={stage2Reference}
              onChange={(event) => {
                setReadingSaved(false);
                setReadingDirty(true);
                setStage2Reference(event.target.value);
              }}
              placeholder="مثال: يوحنا 15: 1-17"
            />
          </label>
          <label className="facilitator-field">
            <span className="facilitator-field__label">نص المقطع (اختياري — معاينة تحت المرجع)</span>
            <textarea
              className="facilitator-input min-h-[120px] resize-y"
              value={stage2Passage}
              onChange={(event) => {
                setReadingSaved(false);
                setReadingDirty(true);
                setStage2Passage(event.target.value);
              }}
              placeholder="اتركه فارغاً إذا تريد أن يفتح المتسابقون الإنجيل بأنفسهم"
            />
          </label>
        </div>

        <div className="facilitator-timer__buttons mt-4">
          <button
            type="button"
            className="facilitator-btn facilitator-btn--primary"
            onClick={() => void persistStage2Reading()}
            disabled={readingSaving}
          >
            <Save className="h-4 w-4" aria-hidden />
            {readingSaving ? "جارٍ الحفظ..." : "حفظ نص القراءة"}
          </button>
        </div>
        {readingSaved && !readingDirty ? (
          <p className="facilitator-inline-success">
            تم حفظ نص القراءة. يُطبَّق عند بدء مرحلة القراءة التالية.
          </p>
        ) : null}
        {readingError ? <p className="facilitator-inline-error">{readingError}</p> : null}
      </div>
    </div>
  );
}
