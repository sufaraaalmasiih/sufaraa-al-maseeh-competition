"use client";

import { useEffect, useRef, useState } from "react";
import { useCompetitionContentSync } from "@/features/competition-content/competition-content-runtime";
import { useGameFlow } from "@/features/gameflow/use-game-flow";
import { useStage3Ranking } from "@/features/stage3/use-stage3-ranking";
import type { AudienceShellScreensProps } from "@/features/audience/components/audience-shell-screen-types";

export function useAudienceShellData(): AudienceShellScreensProps & {
  status: AudienceShellScreensProps["status"];
} {
  useCompetitionContentSync();

  const {
    status,
    stage3ActiveQuestion,
    stage3OpenedQuestionIds,
    stage3OwnerTeamId,
    stage3OwnerTeamName,
    stage3UsedQuestionIds,
    stage3SelectionTimeoutNotice,
    stage4QuestionIndex,
    stage4QuestionCount,
    loading: gameFlowLoading,
    error: gameFlowError,
  } = useGameFlow();

  const hadFlowRef = useRef(false);
  if (status) {
    hadFlowRef.current = true;
  }

  const needsStage3Ranking = Boolean(status?.startsWith("stage3_"));
  const {
    teams: stage3Teams,
    loading: stage3RankingLoading,
    error: stage3RankingError,
  } = useStage3Ranking(needsStage3Ranking);

  const [bootstrapReady, setBootstrapReady] = useState(false);
  // Fix hydration: server and client both start with bootstrapReady=false
  useEffect(() => {
    setBootstrapReady(true);
  }, []);

  const loading =
    !bootstrapReady || (gameFlowLoading && !status && !hadFlowRef.current);

  return {
    status,
    loading,
    error: gameFlowError,
    stage3: {
      activeQuestion: stage3ActiveQuestion,
      openedQuestionIds: stage3OpenedQuestionIds,
      usedQuestionIds: stage3UsedQuestionIds,
      ownerTeamId: stage3OwnerTeamId,
      ownerTeamName: stage3OwnerTeamName,
      selectionTimeoutNotice: stage3SelectionTimeoutNotice,
      rankingTeams: stage3Teams,
      rankingLoading: stage3RankingLoading,
      rankingError: stage3RankingError,
    },
    stage4: {
      questionIndex: stage4QuestionIndex,
      questionCount: stage4QuestionCount,
    },
  };
}
