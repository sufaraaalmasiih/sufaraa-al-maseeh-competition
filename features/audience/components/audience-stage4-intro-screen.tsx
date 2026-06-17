"use client";

import { useCompetitionContent } from "@/features/competition-content/competition-content-runtime";
import { STAGE4_NAME } from "@/features/stage4/stage4-constants";

export function AudienceStage4IntroScreen() {
  const content = useCompetitionContent();
  const stage = content.stages.stage4;

  return (
    <section className="competition-stage-screen competition-stage-screen--animated">
      <div className="competition-stage-screen__card glass-card-white">
        <span className="competition-stage-screen__badge competition-stage-screen__badge--blue">
          {STAGE4_NAME}
        </span>
        <h2 className="competition-stage-screen__title">{stage.title}</h2>
        <p className="competition-stage-screen__subtitle">{stage.lead}</p>
      </div>
    </section>
  );
}
