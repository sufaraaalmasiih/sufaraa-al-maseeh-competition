"use client";

import { StageIntroContent } from "@/features/stage/components/stage-intro-content";
import { useCompetitionContent } from "@/features/competition-content/competition-content-runtime";

type AudienceStageIntroKey = "stage1" | "stage2" | "stage3" | "stage4";

interface AudienceStageIntroScreenProps {
  stage: AudienceStageIntroKey;
}

export function AudienceStageIntroScreen({ stage }: AudienceStageIntroScreenProps) {
  const content = useCompetitionContent();

  return (
    <StageIntroContent
      stage={stage}
      usesExternalHeader
      footer={<p className="stage1-intro-screen__hint">{content.stages[stage].hint}</p>}
    />
  );
}
