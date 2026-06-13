import {
  COMPETITION_INTRO_STAGES,
  COMPETITION_INTRO_SUMMARY,
} from "@/features/gameflow/competition-intro-copy";

interface CompetitionIntroContentProps {
  showReadyHint?: boolean;
}

export function CompetitionIntroContent({
  showReadyHint = false,
}: CompetitionIntroContentProps) {
  return (
    <div className="competition-intro competition-intro--gradient gameplay-stack text-center">
      <p className="competition-intro__eyebrow">مقدمة المسابقة</p>
      <h1 className="competition-intro__title">{COMPETITION_INTRO_SUMMARY.title}</h1>
      <p className="competition-intro__slogan">{COMPETITION_INTRO_SUMMARY.slogan}</p>
      <p className="competition-intro__lead">{COMPETITION_INTRO_SUMMARY.lead}</p>

      <div className="competition-intro__stages">
        {COMPETITION_INTRO_STAGES.map((stage) => (
          <article key={stage.number} className="competition-intro__stage">
            <p className="competition-intro__stage-number">المرحلة {stage.number}</p>
            <h2 className="competition-intro__stage-name">{stage.name}</h2>
            {Array.isArray(stage.summary) ? (
              <div className="competition-intro__stage-summary-wrap">
                {stage.summary.map((line) => (
                  <p key={line} className="competition-intro__stage-summary">
                    {line}
                  </p>
                ))}
              </div>
            ) : (
              <p className="competition-intro__stage-summary">{stage.summary}</p>
            )}
          </article>
        ))}
      </div>

      {showReadyHint ? (
        <p className="competition-intro__hint">{COMPETITION_INTRO_SUMMARY.readyHint}</p>
      ) : null}
    </div>
  );
}
