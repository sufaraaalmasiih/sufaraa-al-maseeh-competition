"use client";

import { useState } from "react";
import { Archive, ChevronDown, ChevronUp } from "lucide-react";
import { useTeamArchive } from "@/features/facilitator/use-team-archive";
import {
  objectionReasonLabel,
  objectionStatusLabel,
  useTeamObjections,
} from "@/features/facilitator/objections";
import { TeamLogoBadge } from "@/components/competition/team-logo-badge";
import { useTeamLogosMap } from "@/features/gameflow/team-logos-store";

interface TeamArchivePanelProps {
  teamId: string | null;
  teamName?: string;
  defaultOpen?: boolean;
}

function formatArchiveDate(ms: number): string {
  if (!ms || !Number.isFinite(ms)) {
    return "—";
  }
  try {
    return new Date(ms).toLocaleDateString("ar-EG", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "—";
  }
}

export function TeamArchivePanel({
  teamId,
  teamName,
  defaultOpen = false,
}: TeamArchivePanelProps) {
  const [open, setOpen] = useState(defaultOpen);
  // المستمعات تعمل فقط عند فتح اللوحة — توفير قراءات الباقة المجانية.
  const { participations, count, loading, error } = useTeamArchive(teamId, open);
  const { objections } = useTeamObjections(teamId, open);
  const logos = useTeamLogosMap();

  return (
    <div className="rounded-2xl border border-[#E2E8F0] bg-white/80 p-4">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-3 text-right"
        onClick={() => setOpen((current) => !current)}
      >
        <span className="flex items-center gap-2 text-base font-black text-[#143A5A]">
          {teamId ? (
            <TeamLogoBadge
              logoUrl={logos.get(teamId)}
              teamName={teamName ?? "الفريق"}
              variant="hud"
            />
          ) : (
            <Archive className="h-5 w-5 text-[#2388C4]" aria-hidden />
          )}
          أرشيف مشاركات {teamName ? `«${teamName}»` : "الفريق"}
          {open ? (
            <span className="rounded-full bg-[#E9F6FC] px-2 py-0.5 text-sm font-bold text-[#2388C4]">
              {count} مشاركة
            </span>
          ) : (
            <span className="rounded-full bg-[#E9F6FC] px-2 py-0.5 text-xs font-bold text-[#2388C4]">
              اضغط للعرض
            </span>
          )}
        </span>
        {open ? (
          <ChevronUp className="h-5 w-5 text-[#64748B]" aria-hidden />
        ) : (
          <ChevronDown className="h-5 w-5 text-[#64748B]" aria-hidden />
        )}
      </button>

      {open ? (
        <div className="mt-4">
          {loading ? (
            <p className="text-center text-sm font-semibold text-[#64748B]">
              جارٍ تحميل الأرشيف...
            </p>
          ) : error ? (
            <p className="text-center text-sm font-semibold text-[#B45309]">{error}</p>
          ) : count === 0 ? (
            <p className="text-center text-sm font-semibold text-[#64748B]">
              لم يشارك هذا الفريق في أي مسابقة سابقة بعد.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead>
                  <tr className="text-xs font-black text-[#64748B]">
                    <th className="px-2 py-2">#</th>
                    <th className="px-2 py-2">المسابقة</th>
                    <th className="px-2 py-2">التاريخ</th>
                    <th className="px-2 py-2">المركز</th>
                    <th className="px-2 py-2">المجموع</th>
                    <th className="px-2 py-2">م1</th>
                    <th className="px-2 py-2">م2</th>
                    <th className="px-2 py-2">م3</th>
                    <th className="px-2 py-2">م4</th>
                  </tr>
                </thead>
                <tbody>
                  {participations.map((item, index) => (
                    <tr
                      key={item.sessionId}
                      className="border-t border-[#EEF2F6] text-[#143A5A]"
                    >
                      <td className="px-2 py-2 font-bold">{index + 1}</td>
                      <td className="px-2 py-2 font-semibold">
                        {item.version || item.title}
                        {item.hostGovernorate ? (
                          <span className="block text-xs text-[#64748B]">
                            {item.hostGovernorate}
                          </span>
                        ) : null}
                      </td>
                      <td className="px-2 py-2">{formatArchiveDate(item.dateMs)}</td>
                      <td className="px-2 py-2 font-black text-[#2388C4]">{item.rank}</td>
                      <td className="px-2 py-2 font-black">{item.total}</td>
                      <td className="px-2 py-2">{item.stage1}</td>
                      <td className="px-2 py-2">{item.stage2}</td>
                      <td className="px-2 py-2">{item.stage3}</td>
                      <td className="px-2 py-2">{item.stage4}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {objections.length > 0 ? (
            <div className="mt-4">
              <h5 className="mb-2 text-sm font-black text-[#143A5A]">
                اعتراضات الفريق ({objections.length})
              </h5>
              <div className="space-y-2">
                {objections.map((objection) => (
                  <div
                    key={objection.id}
                    className="rounded-lg border border-[#FDE68A] bg-[#FFFBEB] px-3 py-2"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-sm font-bold text-[#143A5A]">
                        {objection.questionLabel}
                      </span>
                      <span className="text-xs font-bold text-[#92400E]">
                        {objectionStatusLabel(objection.status)}
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
      ) : null}
    </div>
  );
}
