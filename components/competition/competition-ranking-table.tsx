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
  showTotalScore?: boolean;
  animate?: boolean;
  compact?: boolean;
  audience?: boolean;
  dualColumnMinTeams?: number;
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
  audience = false,
}: {
  value: number;
  maxValue: number;
  tone: "gold" | "silver" | "bronze" | "active";
  audience?: boolean;
}) {
  const ratio = maxValue <= 0 ? (value > 0 ? 1 : 0) : value / maxValue;
  const filledBars = Math.max(value > 0 ? 1 : 0, Math.round(ratio * 10));

  return (
    <div className={cn("competition-ranking-table__bars", audience && "competition-ranking-table__bars--audience")}>
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

function buildTeamMeta(
  team: CompetitionRankingTableEntry,
  compact: boolean,
  showTotalScore: boolean,
): string {
  if (team.meta) {
    return team.meta;
  }

  const parts: string[] = [];
  if (compact && team.governorate) {
    parts.push(team.governorate);
  }
  if (showTotalScore && typeof team.totalScore === "number") {
    parts.push(`المجموع: ${team.totalScore}`);
  }
  return parts.join(" · ") || "—";
}

interface RankRowProps {
  team: CompetitionRankingTableEntry;
  index: number;
  animate: boolean;
  maxStageScore: number;
  scoreLabel: string;
  showGovernorate: boolean;
  showExtraColumn: boolean;
  showExtra: boolean;
  showTotalScore: boolean;
  extraColumnLabel?: string;
  compact: boolean;
  audience: boolean;
  showGovColumn: boolean;
}

function RankRow({
  team,
  index,
  animate,
  maxStageScore,
  scoreLabel,
  showGovernorate,
  showExtraColumn,
  showExtra,
  showTotalScore,
  extraColumnLabel,
  compact,
  audience,
  showGovColumn,
}: RankRowProps) {
  const tier = rankTier(team.rank);

  if (audience) {
    return (
      <motion.article
        className={cn(
          "competition-ranking-table__audience-card",
          `competition-ranking-table__audience-card--${tier.tone}`,
        )}
        variants={{
          hidden: {
            opacity: 0,
            y: 16,
            scale: 0.98,
          },
          visible: {
            opacity: 1,
            y: 0,
            scale: 1,
            transition: {
              type: "spring",
              stiffness: 420,
              damping: 30,
              delay: animate ? getRankingRowDelay(index) : 0,
            },
          },
        }}
      >
        <span className="competition-ranking-table__rank competition-ranking-table__rank--audience">
          {formatRankNumber(team.rank)}
        </span>

        <TeamLogoBadge
          className="competition-ranking-table__logo"
          logoUrl={team.logoUrl}
          teamName={team.teamName}
          variant="ranking"
        />

        <div className="competition-ranking-table__audience-main">
          <p className="competition-ranking-table__team-name competition-ranking-table__team-name--audience">
            {team.teamName}
          </p>
          {team.governorate ? (
            <p className="competition-ranking-table__team-meta competition-ranking-table__team-meta--audience">
              {team.governorate}
            </p>
          ) : null}
        </div>

        <div className="competition-ranking-table__audience-score">
          <span className="competition-ranking-table__audience-score-label">{scoreLabel}</span>
          <ScoreBars
            audience
            maxValue={maxStageScore}
            tone={tier.tone}
            value={team.stageScore}
          />
        </div>

        <RankTierBadge rank={team.rank} />
      </motion.article>
    );
  }

  return (
    <motion.div
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
                {buildTeamMeta(team, compact, showTotalScore)}
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
          <ScoreBars maxValue={maxStageScore} tone={tier.tone} value={team.stageScore} />
        </div>

        {!compact && showTotalScore ? (
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
}

export function CompetitionRankingTable({
  teams,
  title,
  subtitle,
  scoreLabel = "نقاط المرحلة",
  extraColumnLabel,
  showGovernorate = true,
  showExtraColumn = false,
  showTotalScore = true,
  animate = false,
  compact = false,
  audience = false,
  dualColumnMinTeams = 8,
  live = true,
  className,
}: CompetitionRankingTableProps) {
  const maxStageScore = teams.reduce(
    (max, team) => (team.stageScore > max ? team.stageScore : max),
    0,
  );
  const leadersCount = teams.filter((team) => team.rank <= 3).length;

  const showGovColumn = showGovernorate && !compact && !audience;
  const showExtra = showExtraColumn && !compact && !audience && Boolean(extraColumnLabel);
  const useDualColumn = audience && dualColumnMinTeams > 0 && teams.length >= dualColumnMinTeams;

  const dualRows: CompetitionRankingTableEntry[][] = [];
  if (useDualColumn) {
    for (let index = 0; index < teams.length; index += 2) {
      dualRows.push(teams.slice(index, index + 2));
    }
  }

  const rowPropsBase = {
    animate,
    maxStageScore,
    scoreLabel,
    showGovernorate,
    showExtraColumn,
    showExtra,
    showTotalScore,
    extraColumnLabel,
    compact,
    audience,
    showGovColumn,
  };

  return (
    <div
      className={cn(
        "competition-ranking-table",
        audience && "competition-ranking-table--audience",
        useDualColumn && "competition-ranking-table--dual",
        className,
      )}
      dir="rtl"
    >
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

      {!audience ? (
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
          {!compact && showTotalScore ? <span>المجموع</span> : null}
          {showExtra ? <span>{extraColumnLabel}</span> : null}
          <span>الترتيب</span>
        </div>
      ) : null}

      <motion.div
        className={cn(
          "competition-ranking-table__rows",
          useDualColumn && "competition-ranking-table__rows--dual",
        )}
        initial={animate ? "hidden" : false}
        animate="visible"
        variants={{
          visible: {
            transition: {
              staggerChildren: 0.06,
              delayChildren: 0.04,
            },
          },
        }}
      >
        {useDualColumn
          ? dualRows.map((pair, rowIndex) => (
              <div key={`dual-row-${rowIndex}`} className="competition-ranking-table__dual-row">
                {pair.map((team, columnIndex) => (
                  <RankRow
                    key={team.teamId}
                    index={rowIndex * 2 + columnIndex}
                    team={team}
                    {...rowPropsBase}
                  />
                ))}
              </div>
            ))
          : teams.map((team, index) => (
              <RankRow key={team.teamId} index={index} team={team} {...rowPropsBase} />
            ))}
      </motion.div>
    </div>
  );
}
