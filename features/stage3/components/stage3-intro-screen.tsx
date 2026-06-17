"use client";

import { StageIntroContent } from "@/features/stage/components/stage-intro-content";
import { useCompetitionContent } from "@/features/competition-content/competition-content-runtime";

interface Stage3IntroScreenProps {
  showTeamMeta?: boolean;
}

export function Stage3IntroScreen({ showTeamMeta = false }: Stage3IntroScreenProps) {
  const content = useCompetitionContent();

  return (
    <StageIntroContent
      stage="stage3"
      showTeamMeta={showTeamMeta}
      footer={<p className="stage1-intro-screen__hint">{content.stages.stage3.hint}</p>}
    />
  );
}
