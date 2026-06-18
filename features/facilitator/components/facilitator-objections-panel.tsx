"use client";

import { useMemo, useState } from "react";
import { Check, MessageSquareWarning } from "lucide-react";
import {
  markObjectionReviewed,
  objectionReasonLabel,
  useObjections,
} from "@/features/facilitator/objections";

function formatTime(ms: number): string {
  if (!ms) {
    return "";
  }
  try {
    return new Date(ms).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

export function FacilitatorObjectionsPanel() {
  const { objections, loading } = useObjections();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [showReviewed, setShowReviewed] = useState(false);

  const open = useMemo(
    () => objections.filter((objection) => objection.status === "open"),
    [objections],
  );
  const reviewed = useMemo(
    () => objections.filter((objection) => objection.status === "reviewed"),
    [objections],
  );

  if (loading && objections.length === 0) {
    return null;
  }

  if (objections.length === 0) {
    return null;
  }

  async function handleReviewed(id: string) {
    setBusyId(id);
    try {
      await markObjectionReviewed(id);
    } finally {
      setBusyId(null);
    }
  }

  const visible = showReviewed ? objections : open;

  return (
    <div className="facilitator-card">
      <div className="facilitator-card__head">
        <MessageSquareWarning className="h-5 w-5 text-[#B45309]" aria-hidden />
        <div>
          <h3 className="facilitator-card__title">
            اعتراضات المدربين
            {open.length > 0 ? (
              <span className="ml-2 rounded-full bg-[#FEF3C7] px-2 py-0.5 text-sm font-black text-[#B45309]">
                {open.length} جديد
              </span>
            ) : null}
          </h3>
          <p className="facilitator-card__desc">
            اعتراضات الفرق على الأسئلة. تُحفظ في أرشيف الفريق وأرشيف المسابقة.
          </p>
        </div>
      </div>

      {reviewed.length > 0 ? (
        <button
          type="button"
          className="facilitator-btn facilitator-btn--outline mb-3"
          onClick={() => setShowReviewed((value) => !value)}
        >
          {showReviewed ? "إظهار الجديدة فقط" : `إظهار المُراجَعة (${reviewed.length})`}
        </button>
      ) : null}

      <div className="max-h-[55vh] space-y-3 overflow-y-auto pr-1">
        {visible.length === 0 ? (
          <p className="text-sm font-semibold text-[#64748B]">لا توجد اعتراضات جديدة.</p>
        ) : null}
        {visible.map((objection) => (
          <div
            key={objection.id}
            className={`rounded-xl border p-3 ${
              objection.status === "open"
                ? "border-[#FDE68A] bg-[#FFFBEB]"
                : "border-[#E2E8F0] bg-white/70 opacity-80"
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-black text-[#143A5A]">{objection.teamName}</span>
              <span className="text-xs text-[#64748B]">
                {objection.stage ? `${objection.stage} · ` : ""}
                {formatTime(objection.createdAtMs)}
              </span>
            </div>
            <p className="mt-1 text-sm font-semibold text-[#143A5A]">{objection.questionLabel}</p>
            {objection.reasons.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {objection.reasons.map((reason) => (
                  <span
                    key={reason}
                    className="rounded-full bg-[#FEE2E2] px-2 py-0.5 text-xs font-bold text-[#B91C1C]"
                  >
                    {objectionReasonLabel(reason)}
                  </span>
                ))}
              </div>
            ) : null}
            {objection.note ? (
              <p className="mt-2 rounded-lg bg-white/80 px-3 py-2 text-sm text-[#143A5A]">
                {objection.note}
              </p>
            ) : null}

            {objection.status === "open" ? (
              <button
                type="button"
                disabled={busyId === objection.id}
                className="facilitator-btn facilitator-btn--outline mt-2"
                onClick={() => void handleReviewed(objection.id)}
              >
                <Check className="h-4 w-4" aria-hidden />
                تمت المراجعة
              </button>
            ) : (
              <p className="mt-2 text-xs font-bold text-[#4F8A10]">تمت المراجعة</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
