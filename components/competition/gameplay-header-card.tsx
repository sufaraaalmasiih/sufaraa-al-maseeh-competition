"use client";

import { BrandLogoMark } from "@/components/competition/brand-logo-mark";
import { TeamLogoBadge } from "@/components/competition/team-logo-badge";
import { getCompetitionStageLabel } from "@/features/team/competition-stage-labels";
import { useTeamCompetitionContext } from "@/features/team/use-team-competition-context";
import { useGameFlow } from "@/features/gameflow/use-game-flow";

export function GameplayHeaderCard() {
  const { status } = useGameFlow();
  const { teamName, logoUrl, totalScore, loading } = useTeamCompetitionContext();
  const stageLabel = getCompetitionStageLabel(status);

  return (
    <header className="gameplay-unified-header">
      <div className="gameplay-header-identity">
        <BrandLogoMark className="gameplay-unified-competition-logo" size="lg" />
        <div className="gameplay-unified-brand">
          <p className="gameplay-unified-title">سفراء المسيح</p>
          <p className="gameplay-unified-slogan">نحيا بالكلمة... ونشهد للحق</p>
        </div>
      </div>

      <div className="gameplay-header-meta">
        <TeamLogoBadge
          className="gameplay-unified-team-logo"
          logoUrl={logoUrl}
          teamName={loading ? "فريق" : teamName}
          variant="header"
        />
        <p className="gameplay-unified-team-name">{loading ? "..." : teamName}</p>
        <p className="gameplay-unified-stage">{stageLabel}</p>
        <p className="gameplay-unified-score">
          <span aria-hidden>⭐ </span>
          {loading ? "—" : totalScore} نقطة
        </p>
      </div>
    </header>
  );
}
