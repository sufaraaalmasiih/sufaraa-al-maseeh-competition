"use client";

import { useMemo, useState } from "react";
import { Check, Eye, MessageSquareWarning, ThumbsDown, ThumbsUp } from "lucide-react";
import {
  isObjectionDecided,
  markObjectionSeen,
  objectionReasonLabel,
  objectionsForActiveSession,
  setObjectionDecision,
  useObjections,
} from "@/features/facilitator/objections";
import { useActiveSessionId } from "@/features/facilitator/competition-session";
import { TeamLogoBadge } from "@/components/competition/team-logo-badge";
import { useTeamLogosMap } from "@/features/gameflow/team-logos-store";

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
  const { objections: allObjections, loading } = useObjections();
  const activeSessionId = useActiveSessionId();
  const logos = useTeamLogosMap();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [showDecided, setShowDecided] = useState(false);

  // المسابقة النشطة فقط — اعتراضات المسابقات السابقة تبقى في تبويب «السجل».
  const objections = useMemo(
    () => objectionsForActiveSession(allObjections, activeSessionId),
    [allObjections, activeSessionId],
  );

  const open = useMemo(
    () => objections.filter((objection) => objection.status === "open"),
    [objections],
  );
  const pending = useMemo(
    () => objections.filter((objection) => !isObjectionDecided(objection.status)),
    [objections],
  );
  const decided = useMemo(
    () => objections.filter((objection) => isObjectionDecided(objection.status)),
    [objections],
  );

  if (loading && objections.length === 0) {
    return null;
  }

  if (objections.length === 0) {
    return null;
  }

  async function runAction(id: string, action: () => Promise<void>) {
    setBusyId(id);
    try {
      await action();
    } finally {
      setBusyId(null);
    }
  }

  const visible = showDecided ? objections : pending;

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

      {decided.length > 0 ? (
        <button
          type="button"
          className="facilitator-btn facilitator-btn--outline mb-3"
          onClick={() => setShowDecided((value) => !value)}
        >
          {showDecided ? "إظهار قيد المعالجة فقط" : `إظهار المعالَجة (${decided.length})`}
        </button>
      ) : null}

      <div className="max-h-[55vh] space-y-3 overflow-y-auto pr-1">
        {visible.length === 0 ? (
          <p className="text-sm font-semibold text-[#64748B]">لا توجد اعتراضات قيد المعالجة.</p>
        ) : null}
        {visible.map((objection) => (
          <div
            key={objection.id}
            className={`rounded-xl border p-3 ${
              isObjectionDecided(objection.status)
                ? "border-[#E2E8F0] bg-white/70 opacity-80"
                : "border-[#FDE68A] bg-[#FFFBEB]"
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="flex items-center gap-2 text-sm font-black text-[#143A5A]">
                <TeamLogoBadge
                  logoUrl={logos.get(objection.teamId)}
                  teamName={objection.teamName}
                  variant="hud"
                />
                {objection.teamName}
              </span>
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
                onClick={() => void runAction(objection.id, () => markObjectionSeen(objection.id))}
              >
                <Eye className="h-4 w-4" aria-hidden />
                تم مشاهدة الاعتراض
              </button>
            ) : objection.status === "seen" ? (
              <div className="mt-2 space-y-2">
                <p className="text-xs font-bold text-[#B45309]">
                  <Check className="ml-1 inline h-4 w-4" aria-hidden />
                  تم مشاهدة الاعتراض — اتّخذ قراراً:
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={busyId === objection.id}
                    className="facilitator-btn facilitator-btn--primary"
                    onClick={() =>
                      void runAction(objection.id, () =>
                        setObjectionDecision(objection.id, "accepted"),
                      )
                    }
                  >
                    <ThumbsUp className="h-4 w-4" aria-hidden />
                    قبول الاعتراض
                  </button>
                  <button
                    type="button"
                    disabled={busyId === objection.id}
                    className="facilitator-btn facilitator-btn--outline"
                    onClick={() =>
                      void runAction(objection.id, () =>
                        setObjectionDecision(objection.id, "rejected"),
                      )
                    }
                  >
                    <ThumbsDown className="h-4 w-4" aria-hidden />
                    رفض الاعتراض
                  </button>
                </div>
              </div>
            ) : objection.status === "accepted" ? (
              <p className="mt-2 text-xs font-bold text-[#4F8A10]">
                <ThumbsUp className="ml-1 inline h-4 w-4" aria-hidden />
                مقبول — عدّل نقاط الفريق يدوياً من تبويب «التحكم».
              </p>
            ) : (
              <p className="mt-2 text-xs font-bold text-[#B91C1C]">
                <ThumbsDown className="ml-1 inline h-4 w-4" aria-hidden />
                مرفوض
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
