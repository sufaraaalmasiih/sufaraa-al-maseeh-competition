"use client";

import { EmptyState } from "@/components/layout/empty-state";
import { ErrorState, LoadingState } from "@/components/layout/state-view";
import type { LiveResultRow } from "@/features/facilitator/use-live-results";
import { cn } from "@/lib/utils";

interface FacilitatorLiveResultsTableProps {
  teams: (LiveResultRow & { rank: number })[];
  stageName: string;
  loading: boolean;
  error: string | null;
  ownerTeamId?: string | null;
}

export function FacilitatorLiveResultsTable({
  teams,
  stageName,
  loading,
  error,
  ownerTeamId,
}: FacilitatorLiveResultsTableProps) {
  return (
    <div className="facilitator-card">
      <div className="facilitator-card__head">
        <div>
          <h3 className="facilitator-card__title">النتائج الحالية</h3>
          <p className="facilitator-card__desc">
            متابعة مباشرة لتقدّم الفرق ونقاط المرحلة والمجموع —{" "}
            <span className="font-bold text-[#2388C4]">{stageName}</span>
          </p>
        </div>
      </div>

      {loading ? <LoadingState variant="inline" /> : null}
      {error ? <ErrorState title="تعذر تحميل النتائج" description={error} /> : null}
      {!loading && !error && teams.length === 0 ? (
        <EmptyState title="لا توجد فرق مسجلة حتى الآن." />
      ) : null}

      {!loading && !error && teams.length > 0 ? (
        <div className="facilitator-table-wrap">
          <table className="facilitator-table">
            <thead>
              <tr>
                <th>المرحلة</th>
                <th>الفريق</th>
                <th>السؤال</th>
                <th>نقاط المرحلة</th>
                <th>المجموع</th>
              </tr>
            </thead>
            <tbody>
              {teams.map((team) => {
                const isOwner = ownerTeamId != null && team.teamId === ownerTeamId;
                return (
                  <tr
                    key={team.teamId}
                    className={cn(isOwner && "facilitator-table__row--owner")}
                  >
                    <td className="text-[#2388C4] font-semibold">{stageName}</td>
                    <td className="font-bold text-[#143A5A]">
                      {team.teamName}
                      {isOwner ? (
                        <span className="facilitator-owner-tag">صاحب الدور</span>
                      ) : null}
                    </td>
                    <td>{team.questionLabel}</td>
                    <td className="font-bold text-[#4F8A10]">{team.stageScore}</td>
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
