"use client";

import { Stage1IntroContent } from "@/features/stage1/components/stage1-intro-content";
import { useCompetitionContent } from "@/features/competition-content/competition-content-runtime";

export function Stage1IntroScreen() {
  const content = useCompetitionContent();

  return (
    <Stage1IntroContent
      footer={<p className="stage1-intro-screen__hint">{content.stages.stage1.hint}</p>}
    />
  );
}
