"use client";

import { useMemo, useState } from "react";
import { Users } from "lucide-react";
import { ErrorState, LoadingState } from "@/components/layout/state-view";
import { TeamLogoBadge } from "@/components/competition/team-logo-badge";
import { TeamArchivePanel } from "@/features/facilitator/components/team-archive-panel";
import { useAllRegisteredTeams } from "@/features/facilitator/use-all-teams";
import { useTeamLogosMap } from "@/features/gameflow/team-logos-store";
import { useTeamStatesSnapshot } from "@/features/gameflow/team-states-store";
import { useGameFlow } from "@/features/gameflow/use-game-flow";

export function FacilitatorAllTeamsPanel() {
  const { teams, loading, error } = useAllRegisteredTeams();
  const { docs: teamStateDocs } = useTeamStatesSnapshot("main");
  const { status } = useGameFlow();
  const logos = useTeamLogosMap();
  const [expandedTeamId, setExpandedTeamId] = useState<string | null>(null);

  // الفرق المشاركة فعلياً في المسابقة الحالية = لها مستند teamState (لم تُخرَج).
  const participatingIds = useMemo(
    () => new Set(teamStateDocs.map((doc) => doc.id)),
    [teamStateDocs],
  );

  const competitionStarted = status !== null && status !== "waiting_players";
  // فريق «مشارك» = هناك مسابقة جارية وله بيانات مسابقة. بعد الإنهاء يصبح الجميع غير مشاركين.
  const isParticipating = (teamId: string) =>
    competitionStarted && participatingIds.has(teamId);
  const participatingCount = teams.filter((team) => isParticipating(team.teamId)).length;

  return (
    <div className="facilitator-card">
      <div className="facilitator-card__head">
        <Users className="h-5 w-5 text-[#2388C4]" aria-hidden />
        <div>
          <h3 className="facilitator-card__title">
            كل الفرق المسجّلة ({teams.length})
          </h3>
          <p className="facilitator-card__desc">
            جميع الفرق التي أنشأت حساباً — مع أرشيف كل فريق وحالته في المسابقة الحالية.
          </p>
        </div>
      </div>

      {!competitionStarted ? (
        <p className="mb-4 rounded-xl bg-[#FFF7ED] px-4 py-3 text-sm font-bold text-[#B45309]">
          لا توجد مسابقة جارية الآن — لا أحد مشارك بعد. تبدأ المسابقة عندما يبدؤها
          الميسّر من تبويب «سير المسابقة» ويحدّد نوعها (مسابقة رسمية أو تدريب).
        </p>
      ) : (
        <p className="mb-4 rounded-xl bg-[#ECFDF5] px-4 py-3 text-sm font-bold text-[#047857]">
          مسابقة جارية — {participatingCount} من {teams.length} فريقاً مشارك حالياً.
        </p>
      )}

      {loading ? <LoadingState variant="inline" /> : null}
      {error ? <ErrorState title="تعذر التحميل" description={error} /> : null}

      {!loading && !error ? (
        <div className="space-y-3">
          {teams.length === 0 ? (
            <p className="text-sm font-semibold text-[#64748B]">لا توجد فرق مسجّلة بعد.</p>
          ) : null}
          {teams.map((team) => {
            const participating = isParticipating(team.teamId);
            const open = expandedTeamId === team.teamId;
            return (
              <div
                key={team.teamId}
                className="rounded-2xl border border-[#E2E8F0] bg-white/80 p-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <TeamLogoBadge
                      logoUrl={logos.get(team.teamId)}
                      teamName={team.teamName}
                      variant="hud"
                    />
                    <div>
                      <p className="text-sm font-black text-[#143A5A]">{team.teamName}</p>
                      <p className="text-xs text-[#64748B]">
                        {team.governorate} · {team.playersCount} لاعب
                        {team.email ? ` · ${team.email}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-black ${
                        participating
                          ? "bg-[#ECFDF5] text-[#047857]"
                          : "bg-[#F1F5F9] text-[#64748B]"
                      }`}
                    >
                      {participating ? "مشارك حالياً" : "غير مشارك"}
                    </span>
                    <button
                      type="button"
                      className="facilitator-btn facilitator-btn--outline"
                      onClick={() => setExpandedTeamId(open ? null : team.teamId)}
                    >
                      {open ? "إخفاء التفاصيل" : "عرض التفاصيل والأرشيف"}
                    </button>
                  </div>
                </div>

                {open ? (
                  <div className="mt-3">
                    <TeamArchivePanel
                      teamId={team.teamId}
                      teamName={team.teamName}
                      defaultOpen
                    />
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
