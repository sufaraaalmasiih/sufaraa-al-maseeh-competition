import type { Stage3SelectionTimeoutNotice } from "@/features/stage3/stage3-selection-timeout-notice";
import type { RankedStage3Team } from "@/features/stage3/stage3-ranking";
import type { Stage3QuestionMetadata } from "@/features/stage3/stage3-question-types";
import type { GameFlowStatus } from "@/types";

export interface AudienceShellStage3Context {
  activeQuestion: Stage3QuestionMetadata | null;
  openedQuestionIds: string[];
  usedQuestionIds: string[];
  ownerTeamName: string | null;
  selectionTimeoutNotice: Stage3SelectionTimeoutNotice | null;
  rankingTeams: RankedStage3Team[];
  rankingLoading: boolean;
  rankingError: string | null;
}

export interface AudienceShellStage4Context {
  questionIndex: number;
  questionCount: number;
}

export interface AudienceShellScreensProps {
  status: GameFlowStatus | null | undefined;
  loading: boolean;
  error: string | null;
  loadingVariant?: "page" | "inline";
  stage3: AudienceShellStage3Context;
  stage4: AudienceShellStage4Context;
}
