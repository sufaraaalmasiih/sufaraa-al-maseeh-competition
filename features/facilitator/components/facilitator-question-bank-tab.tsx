"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { FileSpreadsheet, Plus, Save, Trash2, Upload } from "lucide-react";
import { LoadingState } from "@/components/layout/state-view";
import {
  parseStage1RowsToQuestions,
  saveStage1Bank,
  useStage1BankEditor,
} from "@/features/facilitator/stage1-question-bank-store";
import {
  getStage1QuestionTypeLabel,
  type Stage1MockQuestion,
  type Stage1QuestionType,
} from "@/features/stage1/stage1-types";

const TYPE_OPTIONS: Stage1QuestionType[] = [
  "missing",
  "fill_blank",
  "multiple_choice",
  "arrange",
];

function emptyQuestion(index: number): Stage1MockQuestion {
  return {
    id: `stage1-q-${Date.now()}-${index}`,
    type: "missing",
    prompt: "",
    correctAnswer: "",
  };
}

function listToText(list: string[] | undefined): string {
  return (list ?? []).join("\n");
}

function textToList(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export function FacilitatorQuestionBankTab() {
  const { questions, loading, error } = useStage1BankEditor();
  const [draft, setDraft] = useState<Stage1MockQuestion[]>([]);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<
    { kind: "success" | "error"; text: string } | null
  >(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!dirty && questions) {
      setDraft(questions);
    }
  }, [questions, dirty]);

  const usingFirestore = (questions?.length ?? 0) > 0;

  const summary = useMemo(() => {
    const counts: Record<string, number> = {};
    draft.forEach((question) => {
      counts[question.type] = (counts[question.type] ?? 0) + 1;
    });
    return counts;
  }, [draft]);

  function patchQuestion(index: number, patch: Partial<Stage1MockQuestion>) {
    setDirty(true);
    setFeedback(null);
    setDraft((current) =>
      current.map((question, position) =>
        position === index ? ({ ...question, ...patch } as Stage1MockQuestion) : question,
      ),
    );
  }

  function changeType(index: number, type: Stage1QuestionType) {
    setDirty(true);
    setDraft((current) =>
      current.map((question, position) => {
        if (position !== index) {
          return question;
        }
        const base = {
          id: question.id,
          type,
          prompt: question.prompt,
          reference: question.reference,
          correctAnswer: question.correctAnswer,
        };
        if (type === "multiple_choice") {
          return {
            ...base,
            type: "multiple_choice" as const,
            options: (question as { options?: string[] }).options ?? [],
          };
        }
        if (type === "arrange") {
          return {
            ...base,
            type: "arrange" as const,
            parts: (question as { parts?: string[] }).parts ?? [],
          };
        }
        if (type === "fill_blank") {
          return { ...base, type: "fill_blank" as const };
        }
        return { ...base, type: "missing" as const };
      }),
    );
  }

  function addQuestion() {
    setDirty(true);
    setDraft((current) => [...current, emptyQuestion(current.length)]);
  }

  function removeQuestion(index: number) {
    setDirty(true);
    setDraft((current) => current.filter((_, position) => position !== index));
  }

  async function handleImport(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }
    setFeedback(null);
    try {
      const XLSX = await import("xlsx");
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet, {
        defval: "",
      });
      const imported = parseStage1RowsToQuestions(rows);
      if (imported.length === 0) {
        setFeedback({
          kind: "error",
          text: "لم يتم العثور على أسئلة صالحة في الملف. تحقق من الأعمدة (type, prompt, correctAnswer).",
        });
        return;
      }
      setDirty(true);
      setDraft(imported);
      setFeedback({
        kind: "success",
        text: `تم استيراد ${imported.length} سؤالاً من الملف. راجِعها ثم اضغط حفظ.`,
      });
    } catch {
      setFeedback({ kind: "error", text: "تعذر قراءة الملف." });
    }
  }

  async function handleSave() {
    setSaving(true);
    setFeedback(null);
    try {
      await saveStage1Bank(draft);
      setDirty(false);
      setFeedback({
        kind: "success",
        text: `تم حفظ ${draft.length} سؤالاً. ستظهر للمتسابقين في المرحلة الأولى.`,
      });
    } catch {
      setFeedback({ kind: "error", text: "تعذر حفظ بنك الأسئلة." });
    } finally {
      setSaving(false);
    }
  }

  async function handleRestoreDefault() {
    if (!window.confirm("استخدام بنك الأسئلة الافتراضي؟ سيُحذف البنك المخصص.")) {
      return;
    }
    setSaving(true);
    try {
      await saveStage1Bank([]);
      setDirty(false);
      setDraft([]);
      setFeedback({ kind: "success", text: "تمت العودة إلى البنك الافتراضي." });
    } catch {
      setFeedback({ kind: "error", text: "تعذر استعادة الافتراضي." });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <LoadingState />;
  }

  return (
    <div className="space-y-6">
      <div className="facilitator-card">
        <div className="facilitator-card__head">
          <FileSpreadsheet className="h-5 w-5 text-[#2388C4]" aria-hidden />
          <div>
            <h3 className="facilitator-card__title">بنك أسئلة المرحلة الأولى</h3>
            <p className="facilitator-card__desc">
              استورد الأسئلة من ملف Excel/CSV أو حرّرها هنا. تُحفظ في قاعدة البيانات
              ويستخدمها المتسابقون مباشرة. الأعمدة المتوقعة: type, prompt, reference,
              correctAnswer, options, parts.
            </p>
          </div>
        </div>

        <div className="facilitator-timer__state">
          <span>
            المصدر الحالي: {usingFirestore ? "بنك مخصص (Firestore)" : "البنك الافتراضي"}
          </span>
          <span>عدد الأسئلة في المسودة: {draft.length}</span>
          {TYPE_OPTIONS.map((type) =>
            summary[type] ? (
              <span key={type}>
                {getStage1QuestionTypeLabel(type)}: {summary[type]}
              </span>
            ) : null,
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          className="hidden"
          onChange={(event) => void handleImport(event)}
        />

        <div className="facilitator-timer__buttons">
          <button
            type="button"
            className="facilitator-btn facilitator-btn--outline"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-4 w-4" aria-hidden />
            استيراد من Excel/CSV
          </button>
          <button
            type="button"
            className="facilitator-btn facilitator-btn--outline"
            onClick={addQuestion}
          >
            <Plus className="h-4 w-4" aria-hidden />
            إضافة سؤال
          </button>
          <button
            type="button"
            className="facilitator-btn facilitator-btn--primary"
            disabled={saving || !dirty}
            onClick={() => void handleSave()}
          >
            <Save className="h-4 w-4" aria-hidden />
            {saving ? "جارٍ الحفظ..." : "حفظ البنك"}
          </button>
          <button
            type="button"
            className="facilitator-btn facilitator-btn--danger"
            disabled={saving}
            onClick={() => void handleRestoreDefault()}
          >
            استعادة الافتراضي
          </button>
        </div>

        {feedback ? (
          <p
            className={
              feedback.kind === "success"
                ? "facilitator-inline-success"
                : "facilitator-inline-error"
            }
          >
            {feedback.text}
          </p>
        ) : null}
      </div>

      {draft.length === 0 ? (
        <div className="facilitator-card">
          <p className="facilitator-card__desc">
            لا توجد أسئلة مخصصة. يستخدم المتسابقون البنك الافتراضي. استورد ملفاً أو
            أضف سؤالاً للبدء.
          </p>
        </div>
      ) : (
        draft.map((question, index) => (
          <div key={`${question.id}-${index}`} className="facilitator-card">
            <div className="facilitator-card__head">
              <h3 className="facilitator-card__title">سؤال {index + 1}</h3>
              <button
                type="button"
                className="facilitator-btn facilitator-btn--danger"
                onClick={() => removeQuestion(index)}
              >
                <Trash2 className="h-4 w-4" aria-hidden />
                حذف
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="facilitator-field">
                <span className="facilitator-field__label">النوع</span>
                <select
                  className="facilitator-input"
                  value={question.type}
                  onChange={(event) =>
                    changeType(index, event.target.value as Stage1QuestionType)
                  }
                >
                  {TYPE_OPTIONS.map((type) => (
                    <option key={type} value={type}>
                      {getStage1QuestionTypeLabel(type)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="facilitator-field">
                <span className="facilitator-field__label">الشاهد (اختياري)</span>
                <input
                  type="text"
                  className="facilitator-input"
                  value={question.reference ?? ""}
                  onChange={(event) =>
                    patchQuestion(index, { reference: event.target.value })
                  }
                />
              </label>
            </div>

            <label className="facilitator-field">
              <span className="facilitator-field__label">نص السؤال</span>
              <textarea
                className="facilitator-input"
                rows={2}
                value={question.prompt}
                onChange={(event) => patchQuestion(index, { prompt: event.target.value })}
              />
            </label>

            <label className="facilitator-field">
              <span className="facilitator-field__label">الإجابة الصحيحة</span>
              <input
                type="text"
                className="facilitator-input"
                value={question.correctAnswer}
                onChange={(event) =>
                  patchQuestion(index, { correctAnswer: event.target.value })
                }
              />
            </label>

            {question.type === "multiple_choice" ? (
              <label className="facilitator-field">
                <span className="facilitator-field__label">
                  الخيارات (خيار في كل سطر)
                </span>
                <textarea
                  className="facilitator-input"
                  rows={4}
                  value={listToText((question as { options?: string[] }).options)}
                  onChange={(event) =>
                    patchQuestion(index, {
                      options: textToList(event.target.value),
                    } as Partial<Stage1MockQuestion>)
                  }
                />
              </label>
            ) : null}

            {question.type === "arrange" ? (
              <label className="facilitator-field">
                <span className="facilitator-field__label">
                  الأجزاء بالترتيب الصحيح (جزء في كل سطر)
                </span>
                <textarea
                  className="facilitator-input"
                  rows={4}
                  value={listToText((question as { parts?: string[] }).parts)}
                  onChange={(event) =>
                    patchQuestion(index, {
                      parts: textToList(event.target.value),
                    } as Partial<Stage1MockQuestion>)
                  }
                />
              </label>
            ) : null}
          </div>
        ))
      )}
    </div>
  );
}
