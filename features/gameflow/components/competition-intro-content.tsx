"use client";

import { getCompetitionContent } from "@/features/competition-content/competition-content-runtime";
import { useCompetitionContentSync } from "@/features/competition-content/competition-content-runtime";

interface CompetitionIntroContentProps {
  showReadyHint?: boolean;
}

export function CompetitionIntroContent({
  showReadyHint = false,
}: CompetitionIntroContentProps) {
  useCompetitionContentSync();
  const content = getCompetitionContent();

  return (
    <div className="competition-intro competition-intro--gradient gameplay-stack text-center">
      <p className="competition-intro__eyebrow">{content.competitionIntro.eyebrow}</p>
      <h1 className="competition-intro__title">{content.brand.title}</h1>
      <p className="competition-intro__slogan">{content.brand.slogan}</p>
      <p className="competition-intro__lead">{content.competitionIntro.lead}</p>

      <div className="competition-intro__stages">
        {content.competitionIntro.stages.map((stage) => (
          <article key={stage.number} className="competition-intro__stage">
            <p className="competition-intro__stage-number">المرحلة {stage.number}</p>
            <h2 className="competition-intro__stage-name">{stage.name}</h2>
            <p className="competition-intro__stage-summary">{stage.summary}</p>
          </article>
        ))}
      </div>

      {showReadyHint ? (
        <p className="competition-intro__hint">{content.competitionIntro.readyHint}</p>
      ) : null}
    </div>
  );
}
