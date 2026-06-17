import type { GameFlowStatus } from "@/types";

export interface CompetitionStageIntroContent {
  name: string;
  title: string;
  lead: string;
  rules: string[];
}

export interface CompetitionStageRichIntroContent extends CompetitionStageIntroContent {
  eyebrow: string;
  videoTitle: string;
  videoId: string;
  hint: string;
}

export interface CompetitionStage1IntroContent extends CompetitionStageRichIntroContent {}

export interface CompetitionIntroStageContent {
  number: number;
  name: string;
  summary: string;
}

export interface CompetitionContentDocument {
  brand: {
    title: string;
    slogan: string;
    facilitatorDescription: string;
  };
  competitionIntro: {
    eyebrow: string;
    lead: string;
    readyHint: string;
    readyDone: string;
    stages: CompetitionIntroStageContent[];
  };
  stages: {
    stage1: CompetitionStageRichIntroContent;
    stage2: CompetitionStageRichIntroContent;
    stage3: CompetitionStageRichIntroContent;
    stage4: CompetitionStageRichIntroContent;
  };
  facilitatorStageRules: {
    stage1: string;
    stage2: string;
    stage3: string;
    stage4: string;
  };
  teamStatusLabels: Record<GameFlowStatus, string>;
  audienceStatusLabels: Record<GameFlowStatus, string>;
  stage3TeamWaiting: Record<
    "answer_closed" | "reveal" | "results_done",
    { title: string; subtitle: string }
  >;
  stage3AudienceWaiting: Record<
    "answer_closed" | "reveal" | "results_done",
    { title: string; subtitle: string }
  >;
}
