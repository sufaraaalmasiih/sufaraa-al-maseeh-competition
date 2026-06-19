"use client";

import { useEffect, useMemo, useState } from "react";
import { Eye, Pencil, Plus, Save, Trash2, ChevronUp, ChevronDown, X } from "lucide-react";
import { useGameFlow } from "@/features/gameflow/use-game-flow";
import { QuestionPreview } from "@/features/facilitator/components/question-preview";
import type { AdminStageKey } from "@/features/facilitator/facilitator-team-admin";
import {
  assertQuestionBankImportAllowed,
  isQuestionBankImportAllowedStatus,
} from "@/features/facilitator/question-bank-lock";
import {
  backupCurrentQuestionBank,
  readCurrentQuestionBankPayload,
  saveFullQuestionBank,
} from "@/features/facilitator/question-bank-store";
import {
  blankItem,
  defaultPointsForStageLevel,
  supportsPointsOverride,
  fieldsForType,
  getTypeLabel,
  itemsToPayload,
  itemsToRows,
  payloadToEditorItems,
  typesForStage,
  validateItem,
  STAGE_LABELS,
  STAGE3_FIELD_OPTIONS,
  STAGE3_LEVEL_OPTIONS,
  type EditorItem,
} from "@/features/facilitator/question-editor-model";
import { validateQuestionBankRows } from "@/features/facilitator/question-bank-workbook-validation";

const STAGES: AdminStageKey[] = ["stage1", "stage2", "stage3", "stage4"];

export function FacilitatorQuestionEditor() {
  const { status } = useGameFlow();
  const editable = isQuestionBankImportAllowedStatus(status);

  const [items, setItems] = useState<EditorItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [activeStage, setActiveStage] = useState<AdminStageKey>("stage1");
  const [editingUid, setEditingUid] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  async function load() {
    const payload = await readCurrentQuestionBankPayload();
    setItems(payload ? payloadToEditorItems(payload) : []);
    setLoaded(true);
    setEditingUid(null);
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stageItems = useMemo(
    () => items.filter((item) => item.stage === activeStage),
    [items, activeStage],
  );

  function patchItem(uid: string, patch: Partial<EditorItem>) {
    setItems((current) => current.map((item) => (item.uid === uid ? { ...item, ...patch } : item)));
  }

  function addItem() {
    const fresh = blankItem(activeStage);
    setItems((current) => [...current, fresh]);
    setEditingUid(fresh.uid);
    setFeedback(null);
  }

  function deleteItem(uid: string) {
    setItems((current) => current.filter((item) => item.uid !== uid));
    if (editingUid === uid) {
      setEditingUid(null);
    }
  }

  function move(uid: string, direction: -1 | 1) {
    setItems((current) => {
      const next = [...current];
      const indices = next.map((item, index) => ({ item, index })).filter((entry) => entry.item.stage === activeStage);
      const pos = indices.findIndex((entry) => entry.item.uid === uid);
      const target = pos + direction;
      if (pos < 0 || target < 0 || target >= indices.length) {
        return current;
      }
      const a = indices[pos].index;
      const b = indices[target].index;
      [next[a], next[b]] = [next[b], next[a]];
      return next;
    });
  }

  async function saveAll() {
    setFeedback(null);
    // تحقق شامل بنفس مُدقِّق Excel قبل الحفظ.
    const report = validateQuestionBankRows(itemsToRows(items));
    if (report.errors.length > 0) {
      const first = report.errors[0];
      setFeedback({
        kind: "error",
        text: `يوجد ${report.errors.length} خطأ — مثال: [${first.field}] ${first.message}. صحّح ثم احفظ.`,
      });
      return;
    }

    setSaving(true);
    try {
      await assertQuestionBankImportAllowed();
      await backupCurrentQuestionBank("نسخة قبل التحرير اليدوي");
      await saveFullQuestionBank(itemsToPayload(items));
      setFeedback({ kind: "success", text: `تم حفظ ${report.totalValidQuestions} سؤالاً في البنك.` });
      setEditingUid(null);
    } catch (error) {
      setFeedback({
        kind: "error",
        text: error instanceof Error ? error.message : "تعذر الحفظ.",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="facilitator-card">
      <div className="facilitator-card__head">
        <Pencil className="h-5 w-5 text-[#2388C4]" aria-hidden />
        <div>
          <h3 className="facilitator-card__title">محرّر الأسئلة داخل التطبيق</h3>
          <p className="facilitator-card__desc">
            أضِف وعدّل أسئلة كل مرحلة بنموذج مخصّص لكل نوع — بلا أخطاء صياغة. احفظ ثم تظهر للمتسابقين مباشرة.
          </p>
        </div>
      </div>

      {!editable ? (
        <p className="mb-3 rounded-xl bg-[#FFF7ED] px-4 py-3 text-sm font-bold text-[#B45309]">
          التحرير متاح قبل بدء المسابقة فقط. أوقف المسابقة أو أعد التعيين للتحرير.
        </p>
      ) : null}

      <div className="mb-4 flex flex-wrap gap-2">
        {STAGES.map((stage) => {
          const count = items.filter((item) => item.stage === stage).length;
          return (
            <button
              key={stage}
              type="button"
              className={`facilitator-btn ${activeStage === stage ? "facilitator-btn--primary" : "facilitator-btn--outline"}`}
              onClick={() => {
                setActiveStage(stage);
                setEditingUid(null);
              }}
            >
              {STAGE_LABELS[stage]} ({count})
            </button>
          );
        })}
      </div>

      {!loaded ? (
        <p className="text-sm text-[#64748B]">جارٍ التحميل...</p>
      ) : (
        <div className="space-y-2">
          {stageItems.length === 0 ? (
            <p className="text-sm font-semibold text-[#64748B]">لا أسئلة في هذه المرحلة بعد — اضغط «إضافة سؤال».</p>
          ) : null}

          {stageItems.map((item, index) => (
            <QuestionRow
              key={item.uid}
              item={item}
              index={index}
              total={stageItems.length}
              editing={editingUid === item.uid}
              disabled={!editable}
              onEdit={() => setEditingUid(editingUid === item.uid ? null : item.uid)}
              onDelete={() => deleteItem(item.uid)}
              onMoveUp={() => move(item.uid, -1)}
              onMoveDown={() => move(item.uid, 1)}
              onPatch={(patch) => patchItem(item.uid, patch)}
            />
          ))}
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          className="facilitator-btn facilitator-btn--outline"
          disabled={!editable}
          onClick={addItem}
        >
          <Plus className="h-4 w-4" aria-hidden />
          إضافة سؤال إلى {STAGE_LABELS[activeStage]}
        </button>
        <button
          type="button"
          className="facilitator-btn facilitator-btn--primary"
          disabled={!editable || saving || !loaded}
          onClick={() => void saveAll()}
        >
          <Save className="h-4 w-4" aria-hidden />
          {saving ? "جارٍ الحفظ..." : "حفظ كل التغييرات إلى البنك"}
        </button>
        <button
          type="button"
          className="facilitator-btn facilitator-btn--outline"
          disabled={saving}
          onClick={() => void load()}
        >
          تجاهل التغييرات وإعادة التحميل
        </button>
      </div>

      {feedback ? (
        <p className={feedback.kind === "success" ? "facilitator-inline-success" : "facilitator-inline-error"}>
          {feedback.text}
        </p>
      ) : null}
    </div>
  );
}

interface QuestionRowProps {
  item: EditorItem;
  index: number;
  total: number;
  editing: boolean;
  disabled: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onPatch: (patch: Partial<EditorItem>) => void;
}

function QuestionRow({
  item,
  index,
  total,
  editing,
  disabled,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
  onPatch,
}: QuestionRowProps) {
  const [showPreview, setShowPreview] = useState(false);
  const errors = editing ? validateItem(item) : [];
  const summary = item.type === "matching" ? `توصيل · ${item.pairs.length} أزواج` : item.question || "(بدون نص)";
  // النقاط الظاهرة لكل سؤال: المُدخلة أو الطبيعية للمرحلة/المستوى.
  const pointsLabel = supportsPointsOverride(item)
    ? item.points.trim() || String(defaultPointsForStageLevel(item.stage, item.level) ?? "")
    : "5+5+5";

  return (
    <div className="rounded-2xl border border-[#E2E8F0] bg-white/80 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <span className="rounded-full bg-[#E9F6FC] px-2 py-0.5 text-xs font-black text-[#2388C4]">
            {getTypeLabel(item.type)}
          </span>
          <span className="ms-2 rounded-full bg-[#ECFDF5] px-2 py-0.5 text-xs font-black text-[#047857]">
            {pointsLabel} نقطة
          </span>
          <span className="ms-2 text-sm font-semibold text-[#143A5A]">{summary}</span>
        </div>
        <div className="flex items-center gap-1">
          <button type="button" className="facilitator-icon-btn" disabled={index === 0} onClick={onMoveUp} title="أعلى">
            <ChevronUp className="h-4 w-4" aria-hidden />
          </button>
          <button
            type="button"
            className="facilitator-icon-btn"
            disabled={index === total - 1}
            onClick={onMoveDown}
            title="أسفل"
          >
            <ChevronDown className="h-4 w-4" aria-hidden />
          </button>
          <button
            type="button"
            className={`facilitator-btn ${showPreview ? "facilitator-btn--primary" : "facilitator-btn--outline"}`}
            onClick={() => setShowPreview((value) => !value)}
          >
            <Eye className="h-4 w-4" aria-hidden />
            معاينة
          </button>
          <button type="button" className="facilitator-btn facilitator-btn--outline" onClick={onEdit}>
            {editing ? <X className="h-4 w-4" aria-hidden /> : <Pencil className="h-4 w-4" aria-hidden />}
            {editing ? "إغلاق" : "تعديل"}
          </button>
          <button
            type="button"
            className="facilitator-btn facilitator-btn--danger"
            disabled={disabled}
            onClick={onDelete}
          >
            <Trash2 className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>

      {editing ? (
        <div className="mt-3">
          <QuestionForm item={item} disabled={disabled} onPatch={onPatch} />
          {errors.length > 0 ? (
            <ul className="mt-2 space-y-1">
              {errors.map((error, errorIndex) => (
                <li key={errorIndex} className="text-xs font-bold text-[#B91C1C]">
                  • [{error.field}] {error.message}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-xs font-bold text-[#047857]">✓ السؤال صالح</p>
          )}
        </div>
      ) : null}

      {showPreview ? (
        <div className="mt-3">
          <QuestionPreview item={item} />
        </div>
      ) : null}
    </div>
  );
}

interface QuestionFormProps {
  item: EditorItem;
  disabled: boolean;
  onPatch: (patch: Partial<EditorItem>) => void;
}

function QuestionForm({ item, disabled, onPatch }: QuestionFormProps) {
  const config = fieldsForType(item.type);
  const inputClass =
    "w-full rounded-lg border border-[#CBD5E1] bg-white px-3 py-2 text-sm text-[#143A5A]";

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Labeled label="رقم السؤال (معرّف فريد)">
          <input
            className={inputClass}
            disabled={disabled}
            value={item.id}
            onChange={(event) => onPatch({ id: event.target.value })}
          />
        </Labeled>
        <Labeled label="النوع">
          <select
            className={inputClass}
            disabled={disabled}
            value={item.type}
            onChange={(event) => onPatch({ type: event.target.value })}
          >
            {typesForStage(item.stage).map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Labeled>
      </div>

      {item.stage === "stage3" ? (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Labeled label="اسم المجال (اكتب أي اسم — حتى 6 مجالات)">
            <input
              className={inputClass}
              list="stage3-field-suggestions"
              disabled={disabled}
              placeholder="مثال: شخصيات"
              value={item.category}
              onChange={(event) => onPatch({ category: event.target.value })}
            />
            <datalist id="stage3-field-suggestions">
              {STAGE3_FIELD_OPTIONS.map((option) => (
                <option key={option.value} value={option.label} />
              ))}
            </datalist>
          </Labeled>
          <Labeled label="المستوى">
            <select
              className={inputClass}
              disabled={disabled}
              value={item.level}
              onChange={(event) => {
                const nextLevel = event.target.value;
                // إن لم يُغيّر المنظِّم النقاط (تساوي افتراضي المستوى الحالي) نُحدّثها لافتراضي المستوى الجديد.
                const oldDefault = defaultPointsForStageLevel(item.stage, item.level);
                const wasDefault = Number(item.points) === oldDefault;
                const nextDefault = defaultPointsForStageLevel(item.stage, nextLevel);
                onPatch({
                  level: nextLevel,
                  ...(wasDefault && nextDefault != null ? { points: String(nextDefault) } : {}),
                });
              }}
            >
              {STAGE3_LEVEL_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </Labeled>
        </div>
      ) : null}

      {config.needsQuestion ? (
        <Labeled label={config.questionLabel}>
          <textarea
            className={`${inputClass} min-h-16 resize-none`}
            disabled={disabled}
            value={item.question}
            onChange={(event) => onPatch({ question: event.target.value })}
          />
        </Labeled>
      ) : null}

      {config.isTrueFalse ? (
        <Labeled label="حكم الجملة">
          <div className="flex gap-2">
            <button
              type="button"
              disabled={disabled}
              className={`facilitator-btn ${item.correctIsTrue ? "facilitator-btn--primary" : "facilitator-btn--outline"}`}
              onClick={() => onPatch({ correctIsTrue: true })}
            >
              صحيحة
            </button>
            <button
              type="button"
              disabled={disabled}
              className={`facilitator-btn ${!item.correctIsTrue ? "facilitator-btn--primary" : "facilitator-btn--outline"}`}
              onClick={() => onPatch({ correctIsTrue: false })}
            >
              بها خطأ
            </button>
          </div>
        </Labeled>
      ) : null}

      {config.needsOptions ? (
        <Labeled label="الخيارات (2–4)">
          <div className="space-y-1">
            {item.options.map((option, index) => (
              <div key={index} className="flex gap-1">
                <input
                  className={inputClass}
                  disabled={disabled}
                  placeholder={`خيار ${index + 1}`}
                  value={option}
                  onChange={(event) => {
                    const next = [...item.options];
                    next[index] = event.target.value;
                    onPatch({ options: next });
                  }}
                />
                {item.options.length > 2 ? (
                  <button
                    type="button"
                    className="facilitator-icon-btn"
                    disabled={disabled}
                    onClick={() => onPatch({ options: item.options.filter((_, i) => i !== index) })}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden />
                  </button>
                ) : null}
              </div>
            ))}
            {item.options.length < 4 ? (
              <button
                type="button"
                className="facilitator-btn facilitator-btn--outline"
                disabled={disabled}
                onClick={() => onPatch({ options: [...item.options, ""] })}
              >
                <Plus className="h-4 w-4" aria-hidden />
                خيار
              </button>
            ) : null}
          </div>
        </Labeled>
      ) : null}

      {config.needsParts ? (
        <Labeled label={config.partsLabel}>
          <div className="space-y-1">
            {item.parts.map((part, index) => (
              <div key={index} className="flex gap-1">
                <input
                  className={inputClass}
                  disabled={disabled}
                  placeholder={`جزء ${index + 1}`}
                  value={part}
                  onChange={(event) => {
                    const next = [...item.parts];
                    next[index] = event.target.value;
                    onPatch({ parts: next });
                  }}
                />
                {item.parts.length > 2 ? (
                  <button
                    type="button"
                    className="facilitator-icon-btn"
                    disabled={disabled}
                    onClick={() => onPatch({ parts: item.parts.filter((_, i) => i !== index) })}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden />
                  </button>
                ) : null}
              </div>
            ))}
            <button
              type="button"
              className="facilitator-btn facilitator-btn--outline"
              disabled={disabled}
              onClick={() => onPatch({ parts: [...item.parts, ""] })}
            >
              <Plus className="h-4 w-4" aria-hidden />
              جزء
            </button>
          </div>
        </Labeled>
      ) : null}

      {config.needsPairs ? (
        <Labeled label="أزواج التوصيل (يسار ⟵ يمين)">
          <div className="space-y-1">
            {item.pairs.map((pair, index) => (
              <div key={index} className="flex gap-1">
                <input
                  className={inputClass}
                  disabled={disabled}
                  placeholder="العبارة (يسار)"
                  value={pair.left}
                  onChange={(event) => {
                    const next = [...item.pairs];
                    next[index] = { ...next[index], left: event.target.value };
                    onPatch({ pairs: next });
                  }}
                />
                <input
                  className={inputClass}
                  disabled={disabled}
                  placeholder="المطابق (يمين)"
                  value={pair.correctRight}
                  onChange={(event) => {
                    const next = [...item.pairs];
                    next[index] = { ...next[index], correctRight: event.target.value };
                    onPatch({ pairs: next });
                  }}
                />
                {item.pairs.length > 1 ? (
                  <button
                    type="button"
                    className="facilitator-icon-btn"
                    disabled={disabled}
                    onClick={() => onPatch({ pairs: item.pairs.filter((_, i) => i !== index) })}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden />
                  </button>
                ) : null}
              </div>
            ))}
            <button
              type="button"
              className="facilitator-btn facilitator-btn--outline"
              disabled={disabled}
              onClick={() => onPatch({ pairs: [...item.pairs, { left: "", correctRight: "" }] })}
            >
              <Plus className="h-4 w-4" aria-hidden />
              زوج
            </button>
          </div>
        </Labeled>
      ) : null}

      {config.needsData ? (
        <Labeled label={config.dataLabel}>
          <input
            className={inputClass}
            disabled={disabled}
            value={item.data}
            onChange={(event) => onPatch({ data: event.target.value })}
          />
        </Labeled>
      ) : null}

      {config.needsCorrect ? (
        <Labeled label={config.correctLabel}>
          <input
            className={inputClass}
            disabled={disabled}
            value={item.correct}
            onChange={(event) => onPatch({ correct: event.target.value })}
          />
        </Labeled>
      ) : null}

      {item.stage === "stage4" && config.needsCorrect ? (
        <Labeled label="إجابات مقبولة أيضاً (افصل بـ |)">
          <input
            className={inputClass}
            disabled={disabled}
            placeholder="مثال: موسى | النبي موسى | موسى النبي"
            value={item.acceptedAnswers.join(" | ")}
            onChange={(event) =>
              onPatch({
                acceptedAnswers: event.target.value
                  .split(/[|،,]/)
                  .map((answer) => answer.trim())
                  .filter(Boolean),
              })
            }
          />
        </Labeled>
      ) : null}

      {supportsPointsOverride(item) ? (
        <Labeled label="نقاط الإجابة الصحيحة (الطبيعي مكتوب — غيّره للتجاوز، حتى 100)">
          <input
            className={inputClass}
            type="number"
            min={1}
            max={100}
            disabled={disabled}
            value={item.points}
            onChange={(event) => onPatch({ points: event.target.value })}
          />
          {item.stage === "stage4" ? (
            <span className="mt-1 block text-[11px] font-semibold text-[#64748B]">
              الطبيعي تصاعدي (15 ثم +2 لكل إجابة متتالية). اكتب رقماً ثابتاً لتجاوز التصاعد.
            </span>
          ) : null}
          {item.stage === "stage3" ? (
            <span className="mt-1 block text-[11px] font-semibold text-[#64748B]">
              تُطبَّق على صاحب الدور؛ الفرق المنافسة تأخذ ثلثها (كنسبة الافتراضي).
            </span>
          ) : null}
        </Labeled>
      ) : null}

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Labeled label={config.needsImage ? "رابط الصورة (إلزامي)" : "رابط الصورة (اختياري)"}>
          <input
            className={inputClass}
            disabled={disabled}
            value={item.imageUrl}
            onChange={(event) => onPatch({ imageUrl: event.target.value })}
          />
        </Labeled>
        <Labeled label="المرجع (اختياري)">
          <input
            className={inputClass}
            disabled={disabled}
            value={item.reference}
            onChange={(event) => onPatch({ reference: event.target.value })}
          />
        </Labeled>
      </div>
    </div>
  );
}

function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-bold text-[#475569]">{label}</span>
      {children}
    </label>
  );
}
