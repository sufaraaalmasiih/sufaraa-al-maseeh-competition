"use client";

import { STAGE_SCORE_COLUMNS } from "@/features/facilitator/facilitator-controls-copy";
import type { ArchiveTeam } from "@/features/facilitator/competition-session";
import { TeamLogoBadge } from "@/components/competition/team-logo-badge";
import { useTeamLogosMap } from "@/features/gameflow/team-logos-store";
import { cn } from "@/lib/utils";

type ScoreKey = (typeof STAGE_SCORE_COLUMNS)[number]["key"];

export function ArchiveResultsTable({
  teams,
  editable = false,
  onScoreChange,
}: {
  teams: ArchiveTeam[];
  editable?: boolean;
  onScoreChange?: (teamId: string, key: ScoreKey, value: string) => void;
}) {
  const logos = useTeamLogosMap();
  return (
    <div className="archive-results-table-wrap">
      <table className="archive-results-table">
        <thead>
          <tr>
            <th className="archive-results-table__rank-th">المركز</th>
            <th className="archive-results-table__team-th">الفريق</th>
            <th className="archive-results-table__gov-th">المحافظة</th>
            {STAGE_SCORE_COLUMNS.map((stage) => (
              <th key={stage.key} className="archive-results-table__stage-th">
                {stage.label}
              </th>
            ))}
            <th className="archive-results-table__total-th">المجموع</th>
          </tr>
        </thead>
        <tbody>
          {teams.map((team) => (
            <tr
              key={team.teamId}
              className={cn(
                team.rank === 1 && "archive-results-table__row--gold",
                team.rank === 2 && "archive-results-table__row--silver",
                team.rank === 3 && "archive-results-table__row--bronze",
              )}
            >
              <td className="archive-results-table__rank">
                <span className="archive-results-table__rank-badge">{team.rank}</span>
              </td>
              <td className="archive-results-table__team">
                <span className="flex items-center gap-2">
                  <TeamLogoBadge
                    logoUrl={logos.get(team.teamId)}
                    teamName={team.teamName}
                    variant="hud"
                  />
                  <span>{team.teamName}</span>
                </span>
              </td>
              <td className="archive-results-table__gov">{team.governorate}</td>
              {STAGE_SCORE_COLUMNS.map((stage) => (
                <td key={stage.key} className="archive-results-table__score">
                  {editable && onScoreChange ? (
                    <input
                      type="number"
                      className="facilitator-input facilitator-input--delta archive-results-table__input"
                      value={team[stage.key]}
                      onChange={(event) =>
                        onScoreChange(team.teamId, stage.key, event.target.value)
                      }
                    />
                  ) : (
                    team[stage.key]
                  )}
                </td>
              ))}
              <td className="archive-results-table__total">{team.total}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
