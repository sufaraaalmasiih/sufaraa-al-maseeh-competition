"use client";

import { BrandLogoMark } from "@/components/competition/brand-logo-mark";
import { TeamLogoBadge } from "@/components/competition/team-logo-badge";
import { getCompetitionStageLabel } from "@/features/team/competition-stage-labels";
import { useCompetitionContent } from "@/features/competition-content/competition-content-runtime";
import { useTeamCompetitionContext } from "@/features/team/use-team-competition-context";
import { useGameFlow } from "@/features/gameflow/use-game-flow";
import { cn } from "@/lib/utils";

interface CompetitionHeaderProps {
  className?: string;
}

export function CompetitionHeader({ className }: CompetitionHeaderProps) {
  const { status } = useGameFlow();
  const content = useCompetitionContent();
  const { teamName, logoUrl, totalScore, loading } = useTeamCompetitionContext();
  const stageLabel = getCompetitionStageLabel(status, content);

  return (
    <header className={cn("glass-header sticky top-0 z-50", className)}>
      <div className="mx-auto flex max-w-5xl items-center gap-3 px-3 py-2 sm:px-4">
        <BrandLogoMark size="md" />
        <TeamLogoBadge
          className="ring-1 ring-white/60"
          logoUrl={logoUrl}
          teamName={teamName}
          variant="hud"
        />

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-black text-[#143A5A] sm:text-base">
            {loading ? "..." : teamName}
          </p>
          <p className="truncate text-[11px] font-semibold text-[#143A5A]/55 sm:text-xs">
            {stageLabel}
          </p>
        </div>

        <div className="glass-card shrink-0 rounded-xl border-[#F3BC2D]/25 bg-[#F3BC2D]/20 px-3 py-1.5 text-center sm:px-4">
          <p className="text-[10px] font-bold text-[#143A5A]/50">النقاط</p>
          <p className="text-lg font-black leading-none text-[#143A5A] sm:text-xl">
            {loading ? "—" : totalScore}
          </p>
        </div>
      </div>
    </header>
  );
}
