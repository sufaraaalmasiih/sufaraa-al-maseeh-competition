import type { AdminStageKey } from "@/features/facilitator/facilitator-team-admin";
import type { RankedStage3Team } from "@/features/stage3/stage3-ranking";
import type { Stage3QuestionMetadata } from "@/features/stage3/stage3-question-types";
import type { Stage3SelectionTimeoutNotice } from "@/features/stage3/stage3-selection-timeout-notice";
import type { TeamShellViewState } from "@/features/team/components/use-team-shell-view";
import type { GameFlowStatus } from "@/types";

export interface TeamShellStage3Context {
  activeQuestion: Stage3QuestionMetadata | null;
  openedQuestionIds: string[];
  usedQuestionIds: string[];
  ownerTeamId: string | null;
  ownerTeamName: string | null;
  selectionTimeoutNotice: Stage3SelectionTimeoutNotice | null;
  rankingTeams: RankedStage3Team[];
  rankingLoading: boolean;
  rankingError: string | null;
}

export interface TeamShellStage4Context {
  questionIndex: number;
  questionCount: number;
}

export interface TeamShellScreensProps {
  status: GameFlowStatus | null | undefined;
  currentStage: string | null | undefined;
  loading: boolean;
  error: string | null;
  lockedStageKey: AdminStageKey | null;
  view: TeamShellViewState;
  stage3: TeamShellStage3Context;
  stage4: TeamShellStage4Context;
}
