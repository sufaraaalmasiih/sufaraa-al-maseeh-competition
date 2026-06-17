"use client";

import { useMemo } from "react";
import { useGameFlow } from "@/features/gameflow/use-game-flow";
import { isStage1BankComplete } from "@/features/stage1/stage1-question-bank";
import { useStage1TeamProgress } from "@/features/stage1/use-stage1-team-progress";
import { useTeamStage2Progress } from "@/features/stage2/use-team-stage2-progress";
import { useTeamStage4Progress } from "@/features/stage4/use-team-stage4-progress";
import {
  getTeamDisplayStatus,
  isStage3BoardExhausted,
  isStage3GameplayStatus,
  isStage4GameplayStatus,
  isStage4TeamParticipationComplete,
  isTeamStageEarlyFinished,
  type TeamStageEarlyFinishState,
} from "@/features/team/team-stage-early-finish";
import type { GameFlowStatus } from "@/types";

export function useTeamStageEarlyFinish(status: GameFlowStatus | null | undefined) {
  const { stage3UsedQuestionIds, stage4QuestionCount, loading: gameFlowLoading } = useGameFlow();

  const isStage1Active = status === "stage1_running";
  const isStage2Active = status === "stage2_player_turns";
  const isStage3Active = isStage3GameplayStatus(status);
  const isStage4Active = isStage4GameplayStatus(status);

  const {
    questionIndex,
    loading: stage1Loading,
  } = useStage1TeamProgress();
  const {
    progress,
    loading: stage2Loading,
  } = useTeamStage2Progress();
  const {
    answeredQuestionIds,
    loading: stage4Loading,
  } = useTeamStage4Progress();

  const completion = useMemo<TeamStageEarlyFinishState>(
    () => ({
      stage1Complete: isStage1Active && !stage1Loading && isStage1BankComplete(questionIndex),
      stage2Complete: isStage2Active && !stage2Loading && progress.isComplete,
      stage3Complete:
        isStage3Active &&
        !gameFlowLoading &&
        isStage3BoardExhausted(stage3UsedQuestionIds),
      stage4Complete:
        isStage4Active &&
        !stage4Loading &&
        isStage4TeamParticipationComplete(answeredQuestionIds, stage4QuestionCount),
    }),
    [
      answeredQuestionIds,
      gameFlowLoading,
      isStage1Active,
      isStage2Active,
      isStage3Active,
      isStage4Active,
      progress.isComplete,
      questionIndex,
      stage1Loading,
      stage2Loading,
      stage3UsedQuestionIds,
      stage4Loading,
      stage4QuestionCount,
    ],
  );

  const displayStatus = useMemo(
    () => getTeamDisplayStatus(status, completion),
    [status, completion],
  );

  const isEarlyFinished = useMemo(
    () => isTeamStageEarlyFinished(status, completion),
    [status, completion],
  );

  const progressLoading =
    (isStage1Active && stage1Loading) ||
    (isStage2Active && stage2Loading) ||
    (isStage3Active && gameFlowLoading) ||
    (isStage4Active && stage4Loading);

  return {
    displayStatus,
    ...completion,
    isEarlyFinished,
    progressLoading,
  };
}
