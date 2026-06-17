import type { GameFlowStatus } from "@/types";
import { getCompetitionContent } from "@/features/competition-content/competition-content-runtime";
import { DEFAULT_COMPETITION_CONTENT } from "@/features/competition-content/competition-content-defaults";

function createStatusLabelProxy(
  pick: (status: GameFlowStatus) => string,
): Record<GameFlowStatus, string> {
  return new Proxy({} as Record<GameFlowStatus, string>, {
    get(_target, prop) {
      if (typeof prop !== "string") {
        return undefined;
      }
      return pick(prop as GameFlowStatus);
    },
  });
}

/** يقرأ من Firestore عند التشغيل — مع افتراضي ثابت قبل المزامنة. */
export const gameFlowLabels = createStatusLabelProxy(
  (status) =>
    getCompetitionContent().teamStatusLabels[status] ??
    DEFAULT_COMPETITION_CONTENT.teamStatusLabels[status],
);

export const audienceGameFlowLabels = createStatusLabelProxy(
  (status) =>
    getCompetitionContent().audienceStatusLabels[status] ??
    DEFAULT_COMPETITION_CONTENT.audienceStatusLabels[status],
);
