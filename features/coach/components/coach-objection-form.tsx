"use client";

import { useMemo, useState } from "react";
import { MessageSquareWarning, Send } from "lucide-react";
import {
  OBJECTION_REASONS,
  objectionReasonLabel,
  objectionsForActiveSession,
  submitObjection,
  useTeamObjections,
} from "@/features/facilitator/objections";
import { useActiveSessionId } from "@/features/facilitator/competition-session";
import type { CoachHistoryItem } from "@/features/coach/use-coach-dashboard";

interface CoachObjectionFormProps {
  teamId: string | null;
  teamName: string;
  questions: CoachHistoryItem[];
}

const OTHER_QUESTION_VALUE = "__other__";

export function CoachObjectionForm({ teamId, teamName, questions }: CoachObjectionFormProps) {
  const [selectedQuestionId, setSelectedQuestionId] = useState("");
  const [reasons, setReasons] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const { objections: allObjections } = useTeamObjections(teamId);
  const activeSessionId = useActiveSessionId();
  // اعتراضات المسابقة الحالية فقط — تعود إلى صفر عند بدء مسابقة جديدة.
  const objections = useMemo(
    () => objectionsForActiveSession(allObjections, activeSessionId),
    [allObjections, activeSessionId],
  );

  const options = useMemo(() => {
    const seen = new Set<string>();
    return questions.filter((question) => {
      if (seen.has(question.id)) {
        return false;
      }
      seen.add(question.id);
      return true;
    });
  }, [questions]);

  function toggleReason(id: string) {
    setDone(false);
    setReasons((current) =>
      current.includes(id) ? current.filter((reason) => reason !== id) : [...current, id],
    );
  }

  const canSubmit =
    !pending &&
    Boolean(teamId) &&
    selectedQuestionId.length > 0 &&
    (reasons.length > 0 || note.trim().length > 0);

  async function handleSubmit() {
    if (!teamId || !canSubmit) {
      return;
    }

    const selected = options.find((question) => question.id === selectedQuestionId);
    const questionLabel =
      selectedQuestionId === OTHER_QUESTION_VALUE
        ? "سؤال آخر (غير مدرج)"
        : selected?.questionText ?? "سؤال";
    const stage = selectedQuestionId === OTHER_QUESTION_VALUE ? "" : selected?.stage ?? "";

    setPending(true);
    setError(null);
    try {
      await submitObjection({
        teamId,
        teamName,
        questionId: selectedQuestionId === OTHER_QUESTION_VALUE ? null : selectedQuestionId,
        questionLabel,
        stage,
        reasons,
        note,
      });
      setReasons([]);
      setNote("");
      setSelectedQuestionId("");
      setDone(true);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "تعذر إرسال الاعتراض.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="rounded-2xl border border-[#F59E0B]/40 bg-[#FFFBEB] p-4">
      <div className="mb-2 flex items-center gap-2">
        <MessageSquareWarning className="h-5 w-5 text-[#B45309]" aria-hidden />
        <h2 className="text-base font-black text-[#143A5A]">الاعتراض على سؤال</h2>
      </div>
      <p className="mb-3 text-xs font-semibold text-[#92400E]">
        اختر السؤال وسبب الاعتراض (أو اكتب ملاحظتك). يصل الاعتراض للميسّر ويُحفظ في
        أرشيف الفريق وأرشيف المسابقة.
      </p>

      <label className="mb-3 block">
        <span className="mb-1 block text-sm font-bold text-[#143A5A]">السؤال</span>
        <select
          className="facilitator-input w-full"
          value={selectedQuestionId}
          onChange={(event) => {
            setDone(false);
            setSelectedQuestionId(event.target.value);
          }}
          disabled={pending}
        >
          <option value="">— اختر سؤالاً —</option>
          {options.map((question) => (
            <option key={question.id} value={question.id}>
              {question.stage ? `${question.stage} · ` : ""}
              {question.questionText.length > 60
                ? `${question.questionText.slice(0, 60)}…`
                : question.questionText}
            </option>
          ))}
          <option value={OTHER_QUESTION_VALUE}>سؤال آخر (غير مدرج)</option>
        </select>
      </label>

      <div className="mb-3 flex flex-wrap gap-2">
        {OBJECTION_REASONS.map((reason) => {
          const active = reasons.includes(reason.id);
          return (
            <button
              key={reason.id}
              type="button"
              disabled={pending}
              className={`facilitator-chip-btn${active ? " facilitator-chip-btn--active" : ""}`}
              onClick={() => toggleReason(reason.id)}
            >
              {reason.label}
            </button>
          );
        })}
      </div>

      <label className="mb-3 block">
        <span className="mb-1 block text-sm font-bold text-[#143A5A]">
          نص الاعتراض {reasons.length > 0 ? "(اختياري)" : ""}
        </span>
        <textarea
          className="facilitator-input min-h-[90px] w-full resize-y"
          value={note}
          onChange={(event) => {
            setDone(false);
            setNote(event.target.value);
          }}
          placeholder="اكتب تفاصيل الاعتراض إن وجدت..."
          disabled={pending}
        />
      </label>

      <button
        type="button"
        className="facilitator-btn facilitator-btn--primary"
        disabled={!canSubmit}
        onClick={() => void handleSubmit()}
      >
        <Send className="h-4 w-4" aria-hidden />
        {pending ? "جارٍ الإرسال..." : "إرسال الاعتراض"}
      </button>

      {done ? (
        <p className="mt-2 text-sm font-bold text-[#4F8A10]">
          تم إرسال الاعتراض للميسّر وحفظه في الأرشيف.
        </p>
      ) : null}
      {error ? <p className="mt-2 text-sm font-bold text-[#B45309]">{error}</p> : null}

      {objections.length > 0 ? (
        <div className="mt-4 border-t border-[#FDE68A] pt-3">
          <p className="mb-2 text-sm font-black text-[#143A5A]">اعتراضاتك ({objections.length})</p>
          <div className="space-y-2">
            {objections.map((objection) => (
              <div
                key={objection.id}
                className="rounded-lg border border-[#FDE68A] bg-white/80 px-3 py-2"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-bold text-[#143A5A]">
                    {objection.questionLabel}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-black ${
                      objection.status === "reviewed"
                        ? "bg-[#ECFDF5] text-[#047857]"
                        : "bg-[#FEF3C7] text-[#B45309]"
                    }`}
                  >
                    {objection.status === "reviewed" ? "تمت المراجعة ✓" : "قيد المراجعة"}
                  </span>
                </div>
                {objection.reasons.length > 0 ? (
                  <p className="mt-1 text-xs font-semibold text-[#B91C1C]">
                    {objection.reasons.map(objectionReasonLabel).join(" · ")}
                  </p>
                ) : null}
                {objection.note ? (
                  <p className="mt-1 text-xs text-[#143A5A]">{objection.note}</p>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
