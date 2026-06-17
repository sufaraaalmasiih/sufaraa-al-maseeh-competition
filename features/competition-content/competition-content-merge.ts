import { DEFAULT_COMPETITION_CONTENT } from "@/features/competition-content/competition-content-defaults";
import type { CompetitionContentDocument } from "@/features/competition-content/competition-content-types";

function mergeWaitingCopy<T extends Record<string, { title: string; subtitle: string }>>(
  defaults: T,
  overrides?: Partial<T>,
): T {
  if (!overrides) {
    return defaults;
  }

  const merged = { ...defaults };
  for (const key of Object.keys(defaults) as Array<keyof T>) {
    merged[key] = {
      ...defaults[key],
      ...(overrides[key] ?? {}),
    };
  }
  return merged;
}

export function mergeCompetitionContent(
  overrides: Partial<CompetitionContentDocument> | null | undefined,
): CompetitionContentDocument {
  if (!overrides) {
    return DEFAULT_COMPETITION_CONTENT;
  }

  return {
    brand: { ...DEFAULT_COMPETITION_CONTENT.brand, ...overrides.brand },
    competitionIntro: {
      ...DEFAULT_COMPETITION_CONTENT.competitionIntro,
      ...overrides.competitionIntro,
      stages:
        overrides.competitionIntro?.stages?.length === 4
          ? overrides.competitionIntro.stages
          : DEFAULT_COMPETITION_CONTENT.competitionIntro.stages,
    },
    stages: {
      stage1: {
        ...DEFAULT_COMPETITION_CONTENT.stages.stage1,
        ...overrides.stages?.stage1,
        rules:
          overrides.stages?.stage1?.rules?.length
            ? overrides.stages.stage1.rules
            : DEFAULT_COMPETITION_CONTENT.stages.stage1.rules,
      },
      stage2: {
        ...DEFAULT_COMPETITION_CONTENT.stages.stage2,
        ...overrides.stages?.stage2,
        rules:
          overrides.stages?.stage2?.rules?.length
            ? overrides.stages.stage2.rules
            : DEFAULT_COMPETITION_CONTENT.stages.stage2.rules,
      },
      stage3: {
        ...DEFAULT_COMPETITION_CONTENT.stages.stage3,
        ...overrides.stages?.stage3,
        rules:
          overrides.stages?.stage3?.rules?.length
            ? overrides.stages.stage3.rules
            : DEFAULT_COMPETITION_CONTENT.stages.stage3.rules,
      },
      stage4: {
        ...DEFAULT_COMPETITION_CONTENT.stages.stage4,
        ...overrides.stages?.stage4,
        rules:
          overrides.stages?.stage4?.rules?.length
            ? overrides.stages.stage4.rules
            : DEFAULT_COMPETITION_CONTENT.stages.stage4.rules,
      },
    },
    facilitatorStageRules: {
      ...DEFAULT_COMPETITION_CONTENT.facilitatorStageRules,
      ...overrides.facilitatorStageRules,
    },
    teamStatusLabels: {
      ...DEFAULT_COMPETITION_CONTENT.teamStatusLabels,
      ...overrides.teamStatusLabels,
    },
    audienceStatusLabels: {
      ...DEFAULT_COMPETITION_CONTENT.audienceStatusLabels,
      ...overrides.audienceStatusLabels,
    },
    stage3TeamWaiting: mergeWaitingCopy(
      DEFAULT_COMPETITION_CONTENT.stage3TeamWaiting,
      overrides.stage3TeamWaiting,
    ),
    stage3AudienceWaiting: mergeWaitingCopy(
      DEFAULT_COMPETITION_CONTENT.stage3AudienceWaiting,
      overrides.stage3AudienceWaiting,
    ),
  };
}
