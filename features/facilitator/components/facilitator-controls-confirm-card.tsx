"use client";

import { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardPen,
  ShieldAlert,
  X,
} from "lucide-react";

export interface ControlsConfirmDetail {
  label: string;
  value: string;
}

export interface ControlsConfirmRequest {
  title: string;
  tone?: "default" | "danger";
  details: ControlsConfirmDetail[];
  confirmLabel?: string;
  onConfirm: (reason: string) => Promise<void>;
}

interface FacilitatorControlsConfirmCardProps {
  request: ControlsConfirmRequest;
  onClose: () => void;
}

export function FacilitatorControlsConfirmCard({
  request,
  onClose,
}: FacilitatorControlsConfirmCardProps) {
  const [reason, setReason] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const trimmedReason = reason.trim();
  const canConfirm = trimmedReason.length >= 3 && !pending;
  const isDanger = request.tone === "danger";

  async function handleConfirm() {
    if (!canConfirm) {
      return;
    }

    setPending(true);
    setError(null);
    try {
      await request.onConfirm(trimmedReason);
      setSuccess("تم حفظ التعديل وتسجيله في سجل التعديلات.");
      window.setTimeout(() => {
        onClose();
      }, 900);
    } catch (mutationError) {
      setError(
        mutationError instanceof Error ? mutationError.message : "تعذر تنفيذ التعديل.",
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
      aria-labelledby="facilitator-controls-confirm-title"
      onClick={() => {
        if (!pending) {
          onClose();
        }
      }}
    >
      <div
        className={`facilitator-controls-confirm__card${
          isDanger ? " facilitator-controls-confirm__card--danger" : ""
        }`}
        onClick={(event) => event.stopPropagation()}
      >
        <div
          className={`facilitator-controls-confirm__accent${
            isDanger ? " facilitator-controls-confirm__accent--danger" : ""
          }`}
          aria-hidden
        />

        <div className="facilitator-controls-confirm__head">
          <div className="facilitator-controls-confirm__head-main">
            <div
              className={`facilitator-controls-confirm__icon${
                isDanger ? " facilitator-controls-confirm__icon--danger" : ""
              }`}
            >
              {isDanger ? (
                <ShieldAlert className="h-5 w-5" aria-hidden />
              ) : (
                <ClipboardPen className="h-5 w-5" aria-hidden />
              )}
            </div>
            <div>
              <p className="facilitator-controls-confirm__kicker">تأكيد التعديل</p>
              <h3
                id="facilitator-controls-confirm-title"
                className="facilitator-controls-confirm__title"
              >
                {request.title}
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

        <div className="facilitator-controls-confirm__details">
          <p className="facilitator-controls-confirm__details-title">ملخص التعديل</p>
          <div className="facilitator-controls-confirm__grid">
            {request.details.map((detail) => (
              <div
                key={`${detail.label}-${detail.value}`}
                className="facilitator-controls-confirm__tile"
              >
                <span className="facilitator-controls-confirm__tile-label">{detail.label}</span>
                <strong className="facilitator-controls-confirm__tile-value">{detail.value}</strong>
              </div>
            ))}
          </div>
        </div>

        <div className="facilitator-controls-confirm__reason-wrap">
          <label className="facilitator-controls-confirm__reason">
            <span className="facilitator-controls-confirm__reason-label">
              سبب التعديل
              <em>إلزامي</em>
            </span>
            <textarea
              className="facilitator-controls-confirm__textarea"
              rows={3}
              placeholder="اكتب سبباً واضحاً — يُحفظ في سجل التعديلات"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              disabled={pending}
            />
            <span className="facilitator-controls-confirm__reason-hint">
              {trimmedReason.length < 3
                ? "3 أحرف على الأقل مطلوبة للحفظ"
                : "جاهز للحفظ والأرشفة"}
            </span>
          </label>
        </div>

        {error ? (
          <p className="facilitator-controls-confirm__feedback facilitator-controls-confirm__feedback--error">
            <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />
            {error}
          </p>
        ) : null}
        {success ? (
          <p className="facilitator-controls-confirm__feedback facilitator-controls-confirm__feedback--success">
            <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden />
            {success}
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
            className={`facilitator-controls-confirm__submit${
              isDanger ? " facilitator-controls-confirm__submit--danger" : ""
            }`}
            disabled={!canConfirm}
            onClick={() => void handleConfirm()}
          >
            {pending ? "جاري الحفظ..." : request.confirmLabel ?? "تأكيد وحفظ"}
          </button>
        </div>
      </div>
    </div>
  );
}
