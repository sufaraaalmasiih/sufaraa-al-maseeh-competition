"use client";

import { useState } from "react";
import { ClipboardList, GraduationCap, Trophy, X } from "lucide-react";
import { createCompetitionSession } from "@/features/facilitator/competition-session";
import { writeCompetitionMode, type CompetitionMode } from "@/features/facilitator/competition-mode";

interface FacilitatorSessionStartDialogProps {
  open: boolean;
  onClose: () => void;
  onStarted: () => Promise<void>;
}

function toEndsAtMs(value: string): number | null {
  if (!value) {
    return null;
  }
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export function FacilitatorSessionStartDialog({
  open,
  onClose,
  onStarted,
}: FacilitatorSessionStartDialogProps) {
  const [mode, setMode] = useState<CompetitionMode>("official");
  const [trainingEndsAt, setTrainingEndsAt] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) {
    return null;
  }

  async function handleSubmit() {
    setPending(true);
    setError(null);
    try {
      if (mode === "training") {
        const endsAtMs = toEndsAtMs(trainingEndsAt);
        if (endsAtMs !== null && endsAtMs <= Date.now()) {
          throw new Error("وقت انتهاء التدريب يجب أن يكون في المستقبل.");
        }
        await writeCompetitionMode({ mode: "training", trainingEndsAtMs: endsAtMs });
      } else {
        await writeCompetitionMode({ mode: "official", trainingEndsAtMs: null });
        await createCompetitionSession();
      }

      await onStarted();
      setMode("official");
      setTrainingEndsAt("");
      onClose();
    } catch (mutationError) {
      setError(
        mutationError instanceof Error ? mutationError.message : "تعذر بدء المسابقة.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <div
      className="facilitator-controls-confirm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="facilitator-session-start-title"
      onClick={() => {
        if (!pending) {
          onClose();
        }
      }}
    >
      <div className="facilitator-controls-confirm__card" onClick={(event) => event.stopPropagation()}>
        <div className="facilitator-controls-confirm__accent" aria-hidden />

        <div className="facilitator-controls-confirm__head">
          <div className="facilitator-controls-confirm__head-main">
            <div className="facilitator-controls-confirm__icon">
              <ClipboardList className="h-5 w-5" aria-hidden />
            </div>
            <div>
              <p className="facilitator-controls-confirm__kicker">بدء مسابقة جديدة</p>
              <h3 id="facilitator-session-start-title" className="facilitator-controls-confirm__title">
                اختر نوع الجلسة
              </h3>
            </div>
          </div>
          <button
            type="button"
            className="facilitator-controls-confirm__close"
            onClick={onClose}
            disabled={pending}
            aria-label="إغلاق"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>

        <div className="facilitator-controls-confirm__reason-wrap space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              className={`flex flex-col items-center gap-2 rounded-2xl border-2 p-4 text-center transition ${
                mode === "official"
                  ? "border-[#2388C4] bg-[#E9F6FC] text-[#143A5A]"
                  : "border-[#E2E8F0] bg-white text-[#5A6B7D] hover:border-[#2388C4]/40"
              }`}
              onClick={() => setMode("official")}
              disabled={pending}
            >
              <Trophy className="h-6 w-6" aria-hidden />
              <span className="text-base font-black">مسابقة رسمية</span>
              <span className="text-xs font-semibold opacity-80">
                تُحفظ النتائج النهائية في السجل
              </span>
            </button>
            <button
              type="button"
              className={`flex flex-col items-center gap-2 rounded-2xl border-2 p-4 text-center transition ${
                mode === "training"
                  ? "border-[#4F8A10] bg-[#F0FAE6] text-[#143A5A]"
                  : "border-[#E2E8F0] bg-white text-[#5A6B7D] hover:border-[#4F8A10]/40"
              }`}
              onClick={() => setMode("training")}
              disabled={pending}
            >
              <GraduationCap className="h-6 w-6" aria-hidden />
              <span className="text-base font-black">تدريب</span>
              <span className="text-xs font-semibold opacity-80">
                بدون سجل — تُمسح البيانات عند الانتهاء
              </span>
            </button>
          </div>

          {mode === "training" ? (
            <label className="facilitator-controls-confirm__reason">
              <span className="facilitator-controls-confirm__reason-label">
                وقت انتهاء التدريب (اختياري — تُمسح البيانات تلقائياً عنده)
              </span>
              <input
                type="datetime-local"
                className="facilitator-input"
                value={trainingEndsAt}
                onChange={(event) => setTrainingEndsAt(event.target.value)}
                disabled={pending}
              />
            </label>
          ) : null}

          <p className="text-sm font-bold leading-7 text-[#143A5A]/65">
            {mode === "official"
              ? "ستبدأ مسابقة رسمية وسيُنشأ سجل تلقائياً لحفظ النتائج النهائية وتعديلات الميسر."
              : "ستبدأ جلسة تدريب: السير والإجابات تعمل بشكل طبيعي، ولا يُنشأ سجل، وتُمسح البيانات عند الانتهاء."}
          </p>
        </div>

        {error ? (
          <p className="facilitator-controls-confirm__feedback facilitator-controls-confirm__feedback--error mx-5 mt-4">
            {error}
          </p>
        ) : null}

        <div className="facilitator-controls-confirm__footer">
          <button
            type="button"
            className="facilitator-btn facilitator-btn--outline facilitator-controls-confirm__cancel"
            disabled={pending}
            onClick={onClose}
          >
            إلغاء
          </button>
          <button
            type="button"
            className="facilitator-controls-confirm__submit"
            disabled={pending}
            onClick={() => void handleSubmit()}
          >
            {pending
              ? "جارٍ البدء..."
              : mode === "official"
                ? "بدء المسابقة الرسمية"
                : "بدء التدريب"}
          </button>
        </div>
      </div>
    </div>
  );
}
