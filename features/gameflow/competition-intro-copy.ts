import { DEFAULT_COMPETITION_CONTENT } from "@/features/competition-content/competition-content-defaults";
import { getCompetitionContent } from "@/features/competition-content/competition-content-runtime";

function getSummary() {
  const content = getCompetitionContent();
  return {
    title: content.brand.title,
    slogan: content.brand.slogan,
    lead: content.competitionIntro.lead,
    readyHint: content.competitionIntro.readyHint,
    readyDone: content.competitionIntro.readyDone,
  };
}

export const COMPETITION_INTRO_SUMMARY = new Proxy(
  {
    title: DEFAULT_COMPETITION_CONTENT.brand.title,
    slogan: DEFAULT_COMPETITION_CONTENT.brand.slogan,
    lead: DEFAULT_COMPETITION_CONTENT.competitionIntro.lead,
    readyHint: DEFAULT_COMPETITION_CONTENT.competitionIntro.readyHint,
    readyDone: DEFAULT_COMPETITION_CONTENT.competitionIntro.readyDone,
  },
  {
    get(_target, prop) {
      const summary = getSummary();
      return summary[prop as keyof ReturnType<typeof getSummary>];
    },
  },
);

export const COMPETITION_INTRO_STAGES = new Proxy(
  DEFAULT_COMPETITION_CONTENT.competitionIntro.stages,
  {
    get(target, prop) {
      const stages = getCompetitionContent().competitionIntro.stages;
      if (prop === "length") {
        return stages.length;
      }
      if (prop === "map" || prop === "forEach" || prop === Symbol.iterator) {
        return (stages as typeof target)[prop as keyof typeof target];
      }
      const index = Number(prop);
      if (!Number.isNaN(index)) {
        return stages[index];
      }
      return Reflect.get(stages, prop);
    },
  },
) as typeof DEFAULT_COMPETITION_CONTENT.competitionIntro.stages;
