"use client";

import { motion } from "framer-motion";
import { TeamLogoBadge } from "@/components/competition/team-logo-badge";
import { useTeamLogosMap } from "@/features/gameflow/team-logos-store";
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
  { medal: string; rank: number; label: string; revealDelay: number }
> = {
  third: { medal: "🥉", rank: 3, label: "المركز الثالث", revealDelay: 0.25 },
  second: { medal: "🥈", rank: 2, label: "المركز الثاني", revealDelay: 0.65 },
  first: { medal: "🥇", rank: 1, label: "المركز الأول", revealDelay: 1.15 },
};

interface CompetitionPodiumProps {
  teams: CompetitionPodiumTeam[];
  showHeader?: boolean;
  showGovernorate?: boolean;
  animate?: boolean;
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
  animate = true,
}: CompetitionPodiumProps) {
  const topThree = teams.slice(0, 3);
  const logos = useTeamLogosMap();

  if (topThree.length === 0) {
    return null;
  }

  return (
    <div className="competition-podium">
      {showHeader ? (
        <motion.div
          className="competition-podium__head"
          initial={animate ? { opacity: 0, y: 16 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="competition-podium__kicker">منصة التكريم</p>
          <h3 className="competition-podium__heading">أفضل ثلاثة فرق</h3>
        </motion.div>
      ) : null}

      <div className="competition-podium__stage">
        {PODIUM_SLOTS.map((slot) => {
          const team = teamForSlot(topThree, slot);
          const meta = SLOT_META[slot];

          return (
            <motion.article
              key={slot}
              className={cn(
                "competition-podium__slot",
                `competition-podium__slot--${slot}`,
                !team && "competition-podium__slot--empty",
              )}
              aria-label={team ? `${meta.label}: ${team.teamName}` : meta.label}
              initial={animate ? { opacity: 0, y: 48, scale: 0.9 } : false}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{
                type: "spring",
                stiffness: 260,
                damping: 22,
                delay: animate ? meta.revealDelay : 0,
              }}
            >
              <motion.div
                className="competition-podium__cap"
                initial={animate ? { opacity: 0, y: 20 } : false}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.42,
                  delay: animate ? meta.revealDelay + 0.12 : 0,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                {team ? (
                  <>
                    <span className="competition-podium__medal" aria-hidden>
                      {meta.medal}
                    </span>
                    <p className="competition-podium__rank-label">{meta.label}</p>
                    <div className="mb-2 flex justify-center">
                      <TeamLogoBadge
                        logoUrl={logos.get(team.teamId)}
                        teamName={team.teamName}
                        variant="ranking"
                      />
                    </div>
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
              </motion.div>
              <motion.div
                className="competition-podium__pedestal"
                aria-hidden
                initial={animate ? { scaleY: 0.2, opacity: 0.4 } : false}
                animate={{ scaleY: 1, opacity: 1 }}
                transition={{
                  duration: 0.5,
                  delay: animate ? meta.revealDelay + 0.05 : 0,
                  ease: [0.22, 1, 0.36, 1],
                }}
                style={{ transformOrigin: "bottom center" }}
              >
                <span className="competition-podium__rank">{meta.rank}</span>
              </motion.div>
            </motion.article>
          );
        })}
      </div>
    </div>
  );
}
