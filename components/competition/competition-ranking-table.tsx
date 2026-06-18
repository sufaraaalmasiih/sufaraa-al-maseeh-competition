"use client";

import { LayoutGroup, motion } from "framer-motion";
import { MapPin } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { TeamLogoBadge } from "@/components/competition/team-logo-badge";
import { getRankingRowDelay } from "@/components/motion/animated-ranking-row";
import { useRankingAscendingReveal } from "@/hooks/use-ranking-ascending-reveal";
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
  revealAscending?: boolean;
  layoutReorder?: boolean;
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
  revealAscending: boolean;
  layoutReorder: boolean;
  isClimbing: boolean;
}

const LAYOUT_SPRING = {
  type: "spring" as const,
  stiffness: 260,
  damping: 32,
  mass: 1.15,
};

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
  revealAscending,
  layoutReorder,
  isClimbing,
}: RankRowProps) {
  const tier = rankTier(team.rank);
  const layoutTransition = layoutReorder
    ? {
        layout: LAYOUT_SPRING,
      }
    : undefined;

  const entranceVariants = revealAscending
    ? {
        hidden: {
          opacity: 0,
          y: 36,
          scale: 0.92,
          filter: "blur(4px)",
        },
        visible: {
          opacity: 1,
          y: 0,
          scale: 1,
          filter: "blur(0px)",
          transition: {
            duration: 0.9,
            ease: [0.22, 1, 0.36, 1] as const,
          },
        },
      }
    : {
        hidden: {
          opacity: 0,
          y: audience ? 16 : 0,
          x: audience ? 0 : 24,
          scale: 0.98,
          filter: audience ? undefined : "blur(3px)",
        },
        visible: {
          opacity: 1,
          y: 0,
          x: 0,
          scale: 1,
          filter: "blur(0px)",
          transition: {
            type: "spring" as const,
            stiffness: 420,
            damping: 30,
            delay: animate ? getRankingRowDelay(index) : 0,
          },
        },
      };

  if (audience) {
    return (
      <motion.article
        layout={layoutReorder ? "position" : false}
        transition={layoutTransition}
        className={cn(
          "competition-ranking-table__audience-card",
          `competition-ranking-table__audience-card--${tier.tone}`,
          isClimbing && "competition-ranking-table__audience-card--climbing",
        )}
        initial={animate || revealAscending ? "hidden" : false}
        animate="visible"
        variants={entranceVariants}
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
      layout={layoutReorder ? "position" : false}
      transition={layoutTransition}
      className={cn(
        "competition-ranking-table__row-wrap",
        isClimbing && "competition-ranking-table__row-wrap--climbing",
      )}
      initial={animate || revealAscending ? "hidden" : false}
      animate="visible"
      variants={entranceVariants}
    >
      <div
        className={cn(
          "competition-ranking-table__row",
          `competition-ranking-table__row--${tier.tone}`,
          isClimbing && "competition-ranking-table__row--climbing",
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
  revealAscending = false,
  layoutReorder = false,
  compact = false,
  audience = false,
  dualColumnMinTeams = 8,
  live = true,
  className,
}: CompetitionRankingTableProps) {
  const { visibleTeams, revealedCount, totalCount } = useRankingAscendingReveal(
    teams,
    revealAscending,
  );
  const displayTeams = revealAscending ? visibleTeams : teams;

  const prevRanksRef = useRef<Map<string, number>>(new Map());
  const [climbingTeamIds, setClimbingTeamIds] = useState<ReadonlySet<string>>(() => new Set());

  useEffect(() => {
    if (!layoutReorder) {
      return;
    }

    const climbed = new Set<string>();
    const previous = prevRanksRef.current;

    for (const team of teams) {
      const previousRank = previous.get(team.teamId);
      if (typeof previousRank === "number" && team.rank < previousRank) {
        climbed.add(team.teamId);
      }
    }

    prevRanksRef.current = new Map(teams.map((team) => [team.teamId, team.rank]));

    if (climbed.size === 0) {
      return;
    }

    setClimbingTeamIds(climbed);
    const timeoutId = window.setTimeout(() => {
      setClimbingTeamIds(new Set());
    }, 1_450);

    return () => window.clearTimeout(timeoutId);
  }, [layoutReorder, teams]);

  const maxStageScore = displayTeams.reduce(
    (max, team) => (team.stageScore > max ? team.stageScore : max),
    0,
  );
  const leadersCount = displayTeams.filter((team) => team.rank <= 3).length;

  const showGovColumn = showGovernorate && !compact && !audience;
  const showExtra = showExtraColumn && !compact && !audience && Boolean(extraColumnLabel);
  const useDualColumn =
    audience && dualColumnMinTeams > 0 && displayTeams.length >= dualColumnMinTeams;

  const dualRows: CompetitionRankingTableEntry[][] = [];
  if (useDualColumn) {
    for (let index = 0; index < displayTeams.length; index += 2) {
      dualRows.push(displayTeams.slice(index, index + 2));
    }
  }

  const rowPropsBase = {
    animate: animate && !revealAscending && !layoutReorder,
    revealAscending,
    layoutReorder,
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

  const useParentStagger = animate && !revealAscending && !layoutReorder;

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
            {displayTeams.length} فريق
            {leadersCount > 0 ? ` · ${leadersCount} في المقدمة` : ""}
            {revealAscending && revealedCount < totalCount
              ? ` · جاري الإعلان (${revealedCount}/${totalCount})`
              : ""}
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

      <LayoutGroup id="competition-ranking-rows">
        <motion.div
          className={cn(
            "competition-ranking-table__rows",
            useDualColumn && "competition-ranking-table__rows--dual",
            layoutReorder && "competition-ranking-table__rows--reorder",
          )}
          initial={useParentStagger ? "hidden" : false}
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
                      isClimbing={climbingTeamIds.has(team.teamId)}
                      {...rowPropsBase}
                    />
                  ))}
                </div>
              ))
            : displayTeams.map((team, index) => (
                <RankRow
                  key={team.teamId}
                  index={index}
                  team={team}
                  isClimbing={climbingTeamIds.has(team.teamId)}
                  {...rowPropsBase}
                />
              ))}
        </motion.div>
      </LayoutGroup>
    </div>
  );
}
