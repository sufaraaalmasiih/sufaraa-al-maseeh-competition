"use client";

import { EmptyState } from "@/components/layout/empty-state";
import { ErrorState, LoadingState } from "@/components/layout/state-view";
import type { FacilitatorReadinessKey } from "@/features/facilitator/facilitator-flow-plan";
import { isTeamReadyForReadiness } from "@/features/facilitator/facilitator-readiness";
import type { LiveResultRow } from "@/features/facilitator/use-live-results";
import type { RankedStage1Team } from "@/features/stage1/stage1-ranking";
import { cn } from "@/lib/utils";

type ScoreboardMode = "teams" | "live";

interface FacilitatorScoreboardProps {
  mode: ScoreboardMode;
  className?: string;
  stageName?: string;
  teams?: RankedStage1Team[];
  liveTeams?: (LiveResultRow & { rank: number })[];
  loading: boolean;
  error: string | null;
  readinessKey?: FacilitatorReadinessKey | null;
  ownerTeamId?: string | null;
}

function rankClass(rank: number): string {
  if (rank === 1) {
    return "flow-scoreboard__rank--gold";
  }
  if (rank === 2) {
    return "flow-scoreboard__rank--silver";
  }
  if (rank === 3) {
    return "flow-scoreboard__rank--bronze";
  }
  return "";
}

export function FacilitatorScoreboard({
  mode,
  className,
  stageName,
  teams = [],
  liveTeams = [],
  loading,
  error,
  readinessKey = null,
  ownerTeamId,
}: FacilitatorScoreboardProps) {
  const title = mode === "teams" ? "الفرق المسجّلة" : "لوحة النتائج";
  const desc =
    mode === "teams"
      ? `${teams.length} فريق`
      : `ترتيب مباشر — ${stageName ?? "المرحلة الحالية"}`;

  const leaderTotal =
    mode === "live" && liveTeams.length > 0 ? liveTeams[0].totalScore : 0;

  return (
    <aside className={cn("flow-scoreboard", className)}>
      <div className="flow-scoreboard__head">
        <h3 className="flow-scoreboard__title">{title}</h3>
        <p className="flow-scoreboard__desc">{desc}</p>
        {mode === "live" && liveTeams.length > 0 ? (
          <p className="flow-scoreboard__live-badge">مباشر</p>
        ) : null}
      </div>

      {loading ? <LoadingState variant="inline" /> : null}
      {error ? <ErrorState title="تعذر التحميل" description={error} /> : null}

      {!loading && !error && mode === "teams" && teams.length === 0 ? (
        <EmptyState title="لا توجد فرق مسجلة حتى الآن." />
      ) : null}

      {!loading && !error && mode === "live" && liveTeams.length === 0 ? (
        <EmptyState title="لا توجد فرق مسجلة حتى الآن." />
      ) : null}

      {!loading && !error && mode === "teams" && teams.length > 0 ? (
        <div className="flow-teams-table-wrap competition-ranking-scroll">
          <table className="flow-teams-table">
            <thead>
              <tr>
                <th>#</th>
                <th>الفريق</th>
                <th>المحافظة</th>
                <th>الجاهزية</th>
              </tr>
            </thead>
            <tbody>
              {teams.map((team, index) => {
                const ready = isTeamReadyForReadiness(team, readinessKey);
                const isOwner = ownerTeamId != null && team.teamId === ownerTeamId;
                return (
                  <tr
                    key={team.teamId}
                    className={cn(isOwner && "flow-teams-table__row--owner")}
                  >
                    <td>
                      <span className={cn("flow-teams-table__num", rankClass(index + 1))}>
                        {index + 1}
                      </span>
                    </td>
                    <td className="flow-teams-table__team">
                      {team.teamName}
                      {isOwner ? (
                        <span className="facilitator-owner-tag">صاحب الدور</span>
                      ) : null}
                    </td>
                    <td className="flow-teams-table__gov">{team.governorate}</td>
                    <td>
                      <span
                        className={cn(
                          "flow-teams-table__ready",
                          ready && "flow-teams-table__ready--on",
                        )}
                      >
                        {ready ? "جاهز" : "غير جاهز"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}

      {!loading && !error && mode === "live" && liveTeams.length > 0 ? (
        <ul className="flow-scoreboard__list">
          {liveTeams.map((team) => {
            const isOwner = ownerTeamId != null && team.teamId === ownerTeamId;
            const barWidth =
              leaderTotal > 0 ? Math.max(8, (team.totalScore / leaderTotal) * 100) : 8;
            return (
              <li
                key={team.teamId}
                className={cn(
                  "flow-scoreboard__row flow-scoreboard__row--live",
                  isOwner && "flow-scoreboard__row--owner",
                )}
              >
                <span className={cn("flow-scoreboard__rank", rankClass(team.rank))}>
                  {team.rank}
                </span>
                <div className="flow-scoreboard__main">
                  <p className="flow-scoreboard__team">
                    {team.teamName}
                    {isOwner ? (
                      <span className="facilitator-owner-tag">صاحب الدور</span>
                    ) : null}
                  </p>
                  <p className="flow-scoreboard__meta">{team.questionLabel}</p>
                  <div className="flow-scoreboard__bar" aria-hidden>
                    <span style={{ width: `${barWidth}%` }} />
                  </div>
                </div>
                <div className="flow-scoreboard__stats flow-scoreboard__stats--live">
                  <span className="flow-scoreboard__stage" title="نقاط المرحلة">
                    {team.stageScore}
                  </span>
                  <span className="flow-scoreboard__total" title="المجموع">
                    {team.totalScore}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      ) : null}

      {mode === "live" && liveTeams.length > 0 ? (
        <div className="flow-scoreboard__legend">
          <span>نقاط المرحلة</span>
          <span>المجموع</span>
        </div>
      ) : null}
    </aside>
  );
}
