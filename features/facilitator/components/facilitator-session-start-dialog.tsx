"use client";

import { useState } from "react";
import { ClipboardList, MapPin, X } from "lucide-react";
import { createCompetitionSession } from "@/features/facilitator/competition-session";

interface FacilitatorSessionStartDialogProps {
  open: boolean;
  onClose: () => void;
  onStarted: () => Promise<void>;
}

export function FacilitatorSessionStartDialog({
  open,
  onClose,
  onStarted,
}: FacilitatorSessionStartDialogProps) {
  const [version, setVersion] = useState("");
  const [hostGovernorate, setHostGovernorate] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) {
    return null;
  }

  async function handleSubmit() {
    setPending(true);
    setError(null);
    try {
      await createCompetitionSession({ version, hostGovernorate });
      await onStarted();
      setVersion("");
      setHostGovernorate("");
      onClose();
    } catch (mutationError) {
      setError(
        mutationError instanceof Error
          ? mutationError.message
          : "تعذر إنشاء سجل المسابقة.",
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
                سجل نسخة المسابقة
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
          <label className="facilitator-controls-confirm__reason">
            <span className="facilitator-controls-confirm__reason-label">
              نسخة المسابقة
              <em>إلزامي</em>
            </span>
            <input
              type="text"
              className="facilitator-input"
              placeholder="مثال: النسخة الأولى"
              value={version}
              onChange={(event) => setVersion(event.target.value)}
              disabled={pending}
            />
          </label>

          <label className="facilitator-controls-confirm__reason">
            <span className="facilitator-controls-confirm__reason-label">
              <MapPin className="inline h-4 w-4" aria-hidden />
              المحافظة
              <em>إلزامي</em>
            </span>
            <input
              type="text"
              className="facilitator-input"
              placeholder="مثال: دمشق"
              value={hostGovernorate}
              onChange={(event) => setHostGovernorate(event.target.value)}
              disabled={pending}
            />
          </label>

          <p className="text-sm font-bold leading-7 text-[#143A5A]/65">
            سيُنشأ سجل بعنوان مثل: «مسابقة سفراء المسيح النسخة الأولى في محافظة دمشق»،
            ويُحفظ فيه النتائج النهائية وتعديلات الميسر.
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
            disabled={
              pending || version.trim().length < 2 || hostGovernorate.trim().length < 2
            }
            onClick={() => void handleSubmit()}
          >
            {pending ? "جاري الحفظ..." : "بدء المسابقة وحفظ السجل"}
          </button>
        </div>
      </div>
    </div>
  );
}
