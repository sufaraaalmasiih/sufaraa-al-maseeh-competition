"use client";

import { EmptyState } from "@/components/layout/empty-state";
import { ErrorState, LoadingState } from "@/components/layout/state-view";
import { TeamLogoBadge } from "@/components/competition/team-logo-badge";
import { useTeamLogosMap } from "@/features/gameflow/team-logos-store";
import type { RankedStage1Team } from "@/features/stage1/stage1-ranking";
import type { FacilitatorReadinessKey } from "@/features/facilitator/facilitator-flow-plan";
import { isTeamReadyForReadiness } from "@/features/facilitator/facilitator-readiness";
import { cn } from "@/lib/utils";

interface FacilitatorTeamsTableProps {
  teams: RankedStage1Team[];
  loading: boolean;
  error: string | null;
  readinessKey: FacilitatorReadinessKey | null;
  ownerTeamId?: string | null;
}

export function FacilitatorTeamsTable({
  teams,
  loading,
  error,
  readinessKey,
  ownerTeamId,
}: FacilitatorTeamsTableProps) {
  const logos = useTeamLogosMap();
  return (
    <div className="facilitator-card">
      <div className="facilitator-card__head">
        <div>
          <h3 className="facilitator-card__title">الفرق المسجّلة</h3>
          <p className="facilitator-card__desc">
            متابعة مباشرة لحالة الفرق والجاهزية والنقاط.
          </p>
        </div>
      </div>

      {loading ? <LoadingState variant="inline" /> : null}
      {error ? <ErrorState title="تعذر تحميل الفرق" description={error} /> : null}
      {!loading && !error && teams.length === 0 ? (
        <EmptyState title="لا توجد فرق مسجلة حتى الآن." />
      ) : null}

      {!loading && !error && teams.length > 0 ? (
        <div className="facilitator-table-wrap">
          <table className="facilitator-table">
            <thead>
              <tr>
                <th>الفريق</th>
                <th>المحافظة</th>
                <th>الجاهزية</th>
                <th>السؤال (المرحلة الأولى)</th>
                <th>نقاط المرحلة الأولى</th>
                <th>المجموع</th>
              </tr>
            </thead>
            <tbody>
              {teams.map((team) => {
                const ready = isTeamReadyForReadiness(team, readinessKey);
                const isOwner = ownerTeamId != null && team.teamId === ownerTeamId;
                return (
                  <tr
                    key={team.teamId}
                    className={cn(isOwner && "facilitator-table__row--owner")}
                  >
                    <td className="font-bold text-[#143A5A]">
                      <span className="flex items-center gap-2">
                        <TeamLogoBadge
                          logoUrl={logos.get(team.teamId)}
                          teamName={team.teamName}
                          variant="hud"
                        />
                        <span>{team.teamName}</span>
                        {isOwner ? (
                          <span className="facilitator-owner-tag">صاحب الدور</span>
                        ) : null}
                      </span>
                    </td>
                    <td>{team.governorate}</td>
                    <td>
                      <span
                        className={
                          ready
                            ? "facilitator-ready-dot facilitator-ready-dot--on"
                            : "facilitator-ready-dot"
                        }
                      >
                        {ready ? "جاهز" : "غير جاهز"}
                      </span>
                    </td>
                    <td>{team.stage1QuestionIndex}</td>
                    <td>{team.stage1Score}</td>
                    <td className="font-bold text-[#2388C4]">{team.totalScore}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
