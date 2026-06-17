"use client";

import { StageIntroContent } from "@/features/stage/components/stage-intro-content";
import { useCompetitionContent } from "@/features/competition-content/competition-content-runtime";

interface Stage2IntroScreenProps {
  showTeamMeta?: boolean;
}

export function Stage2IntroScreen({ showTeamMeta = false }: Stage2IntroScreenProps) {
  const content = useCompetitionContent();

  return (
    <StageIntroContent
      stage="stage2"
      showTeamMeta={showTeamMeta}
      footer={<p className="stage1-intro-screen__hint">{content.stages.stage2.hint}</p>}
    />
  );
}
