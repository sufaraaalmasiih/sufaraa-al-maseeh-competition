"use client";

import { GameplayHeaderMeta } from "@/components/competition/gameplay-header-meta";
import { useTeamCompetitionContext } from "@/features/team/use-team-competition-context";

interface StageIntroTeamMetaBlockProps {
  stageLabel: string;
}

export function StageIntroTeamMetaBlock({ stageLabel }: StageIntroTeamMetaBlockProps) {
  const { teamName, logoUrl, totalScore, loading, teamId } = useTeamCompetitionContext();

  if (!teamId) {
    return <span className="stage1-intro-screen__team-slot" aria-hidden />;
  }

  return (
    <GameplayHeaderMeta
      className="stage1-intro-screen__team-meta"
      teamName={teamName}
      logoUrl={logoUrl}
      stageLabel={stageLabel}
      totalScore={totalScore}
      loading={loading}
    />
  );
}
