"use client";

import { ArrowLeft, X } from "lucide-react";

interface FacilitatorAdvanceConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  pending?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function FacilitatorAdvanceConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  pending = false,
  onClose,
  onConfirm,
}: FacilitatorAdvanceConfirmDialogProps) {
  if (!open) {
    return null;
  }

  return (
    <div
      className="facilitator-controls-confirm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="facilitator-advance-confirm-title"
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
              <ArrowLeft className="h-5 w-5" aria-hidden />
            </div>
            <div>
              <p className="facilitator-controls-confirm__kicker">تأكيد الانتقال</p>
              <h3 id="facilitator-advance-confirm-title" className="facilitator-controls-confirm__title">
                {title}
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

        <p className="px-5 pb-2 text-sm font-bold leading-7 text-[#143A5A]/75">{description}</p>

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
            onClick={onConfirm}
          >
            {pending ? "جاري التنفيذ..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
