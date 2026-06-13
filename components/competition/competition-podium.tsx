"use client";

import { cn } from "@/lib/utils";

export interface CompetitionPodiumTeam {
  teamId: string;
  teamName: string;
  score: number;
  governorate?: string;
}

const PODIUM_SLOTS = ["second", "first", "third"] as const;

type PodiumSlot = (typeof PODIUM_SLOTS)[number];

const SLOT_META: Record<
  PodiumSlot,
  { medal: string; rank: number; label: string }
> = {
  first: { medal: "🥇", rank: 1, label: "المركز الأول" },
  second: { medal: "🥈", rank: 2, label: "المركز الثاني" },
  third: { medal: "🥉", rank: 3, label: "المركز الثالث" },
};

interface CompetitionPodiumProps {
  teams: CompetitionPodiumTeam[];
  showHeader?: boolean;
  showGovernorate?: boolean;
}

function teamForSlot(teams: CompetitionPodiumTeam[], slot: PodiumSlot) {
  if (slot === "first") {
    return teams[0] ?? null;
  }
  if (slot === "second") {
    return teams[1] ?? null;
  }
  return teams[2] ?? null;
}

export function CompetitionPodium({
  teams,
  showHeader = true,
  showGovernorate = false,
}: CompetitionPodiumProps) {
  const topThree = teams.slice(0, 3);

  if (topThree.length === 0) {
    return null;
  }

  return (
    <div className="competition-podium">
      {showHeader ? (
        <div className="competition-podium__head">
          <p className="competition-podium__kicker">منصة التكريم</p>
          <h3 className="competition-podium__heading">أفضل ثلاثة فرق</h3>
        </div>
      ) : null}

      <div className="competition-podium__stage">
        {PODIUM_SLOTS.map((slot) => {
          const team = teamForSlot(topThree, slot);
          const meta = SLOT_META[slot];

          return (
            <article
              key={slot}
              className={cn(
                "competition-podium__slot",
                `competition-podium__slot--${slot}`,
                !team && "competition-podium__slot--empty",
              )}
              aria-label={team ? `${meta.label}: ${team.teamName}` : meta.label}
            >
              <div className="competition-podium__cap">
                {team ? (
                  <>
                    <span className="competition-podium__medal" aria-hidden>
                      {meta.medal}
                    </span>
                    <p className="competition-podium__rank-label">{meta.label}</p>
                    <p className="competition-podium__team">{team.teamName}</p>
                    {showGovernorate && team.governorate ? (
                      <p className="competition-podium__meta">{team.governorate}</p>
                    ) : null}
                    <div className="competition-podium__score">
                      <span className="competition-podium__score-value">{team.score}</span>
                      <span className="competition-podium__score-label">نقطة</span>
                    </div>
                  </>
                ) : (
                  <p className="competition-podium__empty">بانتظار الفريق</p>
                )}
              </div>
              <div className="competition-podium__pedestal" aria-hidden>
                <span className="competition-podium__rank">{meta.rank}</span>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
