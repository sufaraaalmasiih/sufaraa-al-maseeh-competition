"use client";

import { StageIntroContent } from "@/features/stage/components/stage-intro-content";
import { useCompetitionContent } from "@/features/competition-content/competition-content-runtime";

interface Stage4IntroScreenProps {
  showTeamMeta?: boolean;
}

export function Stage4IntroScreen({ showTeamMeta = false }: Stage4IntroScreenProps) {
  const content = useCompetitionContent();

  return (
    <StageIntroContent
      stage="stage4"
      showTeamMeta={showTeamMeta}
      showWaitStatus
      footer={<p className="stage1-intro-screen__hint">{content.stages.stage4.hint}</p>}
    />
  );
}
