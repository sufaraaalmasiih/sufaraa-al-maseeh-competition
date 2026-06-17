import { DEFAULT_COMPETITION_CONTENT } from "@/features/competition-content/competition-content-defaults";
import { getCompetitionContent } from "@/features/competition-content/competition-content-runtime";

export const STAGE1_INTRO_VIDEO_ID = DEFAULT_COMPETITION_CONTENT.stages.stage1.videoId;

function getStage1Copy() {
  const content = getCompetitionContent();
  const stage1 = content.stages.stage1;
  return {
    competitionName: content.brand.title,
    competitionSlogan: content.brand.slogan,
    eyebrow: stage1.eyebrow,
    stageName: stage1.name,
    lead: stage1.lead,
    details: stage1.rules,
    videoTitle: stage1.videoTitle,
    hint: stage1.hint,
  };
}

export const STAGE1_INTRO_COPY = new Proxy(
  {
    competitionName: DEFAULT_COMPETITION_CONTENT.brand.title,
    competitionSlogan: DEFAULT_COMPETITION_CONTENT.brand.slogan,
    eyebrow: DEFAULT_COMPETITION_CONTENT.stages.stage1.eyebrow,
    stageName: DEFAULT_COMPETITION_CONTENT.stages.stage1.name,
    lead: DEFAULT_COMPETITION_CONTENT.stages.stage1.lead,
    details: DEFAULT_COMPETITION_CONTENT.stages.stage1.rules,
    videoTitle: DEFAULT_COMPETITION_CONTENT.stages.stage1.videoTitle,
    hint: DEFAULT_COMPETITION_CONTENT.stages.stage1.hint,
  },
  {
    get(_target, prop) {
      const copy = getStage1Copy();
      return copy[prop as keyof ReturnType<typeof getStage1Copy>];
    },
  },
);
