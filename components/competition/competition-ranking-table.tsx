"use client";

import { motion } from "framer-motion";
import { MapPin } from "lucide-react";
import { TeamLogoBadge } from "@/components/competition/team-logo-badge";
import { getRankingRowDelay } from "@/components/motion/animated-ranking-row";
import { cn } from "@/lib/utils";

export interface CompetitionRankingTableEntry {
  teamId: string;
  teamName: string;
  rank: number;
  stageScore: number;
  governorate?: string;
  logoUrl?: string | null;
  totalScore?: number;
  meta?: string;
  extraValue?: string | number | null;
}

interface CompetitionRankingTableProps {
  teams: CompetitionRankingTableEntry[];
  title?: string;
  subtitle?: string;
  scoreLabel?: string;
  extraColumnLabel?: string;
  showGovernorate?: boolean;
  showExtraColumn?: boolean;
  animate?: boolean;
  compact?: boolean;
  live?: boolean;
  className?: string;
}

function formatRankNumber(rank: number): string {
  return rank.toString().padStart(2, "0");
}

function rankTier(rank: number): {
  label: string;
  tone: "gold" | "silver" | "bronze" | "active";
} {
  if (rank === 1) return { label: "الأول", tone: "gold" };
  if (rank === 2) return { label: "الثاني", tone: "silver" };
  if (rank === 3) return { label: "الثالث", tone: "bronze" };
  return { label: "في السباق", tone: "active" };
}

function ScoreBars({
  value,
  maxValue,
  tone,
}: {
  value: number;
  maxValue: number;
  tone: "gold" | "silver" | "bronze" | "active";
}) {
  const ratio = maxValue <= 0 ? 0 : value / maxValue;
  const filledBars = Math.round(ratio * 10);

  return (
    <div className="competition-ranking-table__bars">
      <div className="competition-ranking-table__bars-track" aria-hidden>
        {Array.from({ length: 10 }).map((_, index) => (
          <span
            key={index}
            className={cn(
              "competition-ranking-table__bar",
              index < filledBars && `competition-ranking-table__bar--${tone}`,
            )}
          />
        ))}
      </div>
      <span className="competition-ranking-table__bars-value">{value}</span>
    </div>
  );
}

function RankTierBadge({ rank }: { rank: number }) {
  const tier = rankTier(rank);

  return (
    <span
      className={cn(
        "competition-ranking-table__tier",
        `competition-ranking-table__tier--${tier.tone}`,
      )}
    >
      {tier.label}
    </span>
  );
}

function buildTeamMeta(team: CompetitionRankingTableEntry, compact: boolean): string {
  if (team.meta) {
    return team.meta;
  }

  const parts: string[] = [];
  if (compact && team.governorate) {
    parts.push(team.governorate);
  }
  if (typeof team.totalScore === "number") {
    parts.push(`المجموع: ${team.totalScore}`);
  }
  return parts.join(" · ") || "—";
}

export function CompetitionRankingTable({
  teams,
  title,
  subtitle,
  scoreLabel = "نقاط المرحلة",
  extraColumnLabel,
  showGovernorate = true,
  showExtraColumn = false,
  animate = false,
  compact = false,
  live = true,
  className,
}: CompetitionRankingTableProps) {
  const maxStageScore = teams.reduce(
    (max, team) => (team.stageScore > max ? team.stageScore : max),
    0,
  );
  const leadersCount = teams.filter((team) => team.rank <= 3).length;

  const showGovColumn = showGovernorate && !compact;
  const showExtra = showExtraColumn && !compact && Boolean(extraColumnLabel);

  return (
    <div className={cn("competition-ranking-table", className)} dir="rtl">
      {title ? (
        <div className="competition-ranking-table__header">
          <div className="competition-ranking-table__header-main">
            {live ? <span className="competition-ranking-table__live-dot" aria-hidden /> : null}
            <h3 className="competition-ranking-table__title">{title}</h3>
          </div>
          <p className="competition-ranking-table__stats">
            {teams.length} فريق
            {leadersCount > 0 ? ` · ${leadersCount} في المقدمة` : ""}
          </p>
          {subtitle ? (
            <p className="competition-ranking-table__subtitle">{subtitle}</p>
          ) : null}
        </div>
      ) : null}

      <div
        className={cn(
          "competition-ranking-table__grid-head",
          showGovColumn && showExtra && "competition-ranking-table__grid-head--full-extra",
          showGovColumn && !showExtra && "competition-ranking-table__grid-head--full",
          !showGovColumn && showExtra && "competition-ranking-table__grid-head--compact-extra",
          !showGovColumn && !showExtra && "competition-ranking-table__grid-head--compact",
        )}
      >
        <span>المركز</span>
        <span>الفريق</span>
        {showGovColumn ? <span>المحافظة</span> : null}
        <span>{scoreLabel}</span>
        {!compact ? <span>المجموع</span> : null}
        {showExtra ? <span>{extraColumnLabel}</span> : null}
        <span>الترتيب</span>
      </div>

      <motion.div
        className="competition-ranking-table__rows"
        initial={animate ? "hidden" : false}
        animate="visible"
        variants={{
          visible: {
            transition: {
              staggerChildren: 0.07,
              delayChildren: 0.05,
            },
          },
        }}
      >
        {teams.map((team, index) => {
          const tier = rankTier(team.rank);

          return (
            <motion.div
              key={team.teamId}
              className="competition-ranking-table__row-wrap"
              variants={{
                hidden: {
                  opacity: 0,
                  x: 24,
                  scale: 0.98,
                  filter: "blur(3px)",
                },
                visible: {
                  opacity: 1,
                  x: 0,
                  scale: 1,
                  filter: "blur(0px)",
                  transition: {
                    type: "spring",
                    stiffness: 420,
                    damping: 30,
                    delay: animate ? getRankingRowDelay(index) : 0,
                  },
                },
              }}
            >
              <div
                className={cn(
                  "competition-ranking-table__row",
                  `competition-ranking-table__row--${tier.tone}`,
                  showGovColumn && showExtra && "competition-ranking-table__row--full-extra",
                  showGovColumn && !showExtra && "competition-ranking-table__row--full",
                  !showGovColumn && showExtra && "competition-ranking-table__row--compact-extra",
                  !showGovColumn && !showExtra && "competition-ranking-table__row--compact",
                )}
              >
                <div
                  className={cn(
                    "competition-ranking-table__row-glow",
                    `competition-ranking-table__row-glow--${tier.tone}`,
                  )}
                  aria-hidden
                />

                <span className="competition-ranking-table__rank">{formatRankNumber(team.rank)}</span>

                <div className="competition-ranking-table__team">
                  <TeamLogoBadge
                    className="competition-ranking-table__logo"
                    logoUrl={team.logoUrl}
                    teamName={team.teamName}
                    variant="hud"
                  />
                  <div className="competition-ranking-table__team-copy">
                    <p className="competition-ranking-table__team-name">{team.teamName}</p>
                    {compact ? (
                      <p className="competition-ranking-table__team-meta">
                        {buildTeamMeta(team, compact)}
                      </p>
                    ) : null}
                  </div>
                </div>

                {showGovColumn ? (
                  <div className="competition-ranking-table__location">
                    <span className="competition-ranking-table__location-icon" aria-hidden>
                      <MapPin className="h-3.5 w-3.5" />
                    </span>
                    <span>{team.governorate || "—"}</span>
                  </div>
                ) : null}

                <div className="competition-ranking-table__score-bars">
                  <ScoreBars
                    maxValue={maxStageScore}
                    tone={tier.tone}
                    value={team.stageScore}
                  />
                </div>

                {!compact ? (
                  <span className="competition-ranking-table__total">
                    {typeof team.totalScore === "number" ? team.totalScore : "—"}
                  </span>
                ) : null}

                {showExtra ? (
                  <span className="competition-ranking-table__extra">
                    {team.extraValue ?? "—"}
                  </span>
                ) : null}

                <RankTierBadge rank={team.rank} />
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
