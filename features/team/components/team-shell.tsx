"use client";

import { CompetitionGradientShell } from "@/components/layout/competition-gradient-shell";
import { CompetitionFrozenBanner } from "@/components/layout/competition-frozen-banner";
import { AuthGate } from "@/features/auth/components/auth-gate";
import { useCompetitionContentSync } from "@/features/competition-content/competition-content-runtime";
import { useCompetitionReauthGuard } from "@/features/competition-session/use-competition-reauth-guard";
import { useQuestionBankRuntimeSync } from "@/features/facilitator/question-bank-runtime";
import { isTeamStage2FieldWaiting } from "@/features/stage2/stage2-field-waiting-state";
import { useTeamStage2Progress } from "@/features/stage2/use-team-stage2-progress";
import { CompetitionStage3Automation } from "@/features/stage3/competition-stage3-automation";
import { useStage3Ranking } from "@/features/stage3/use-stage3-ranking";
import { TeamFlowContent } from "@/features/team/components/team-flow-content";
import {
  getTeamShellContentClassName,
  shouldCenterTeamShellContent,
  shouldScrollTeamShellContent,
} from "@/features/team/components/team-shell-layout";
import { TeamShellScreens } from "@/features/team/components/team-shell-screens";
import { useTeamShellView } from "@/features/team/components/use-team-shell-view";
import { useTeamGameFlow } from "@/features/team/use-team-game-flow";
import { useTeamStageEarlyFinish } from "@/features/team/use-team-stage-early-finish";
import { cn } from "@/lib/utils";

function TeamShellAuthenticated() {
  const gameFlow = useTeamGameFlow();
  const {
    status,
    currentStage,
    stage3ActiveQuestion,
    stage3OpenedQuestionIds,
    stage3UsedQuestionIds,
    stage3OwnerTeamId,
    stage3OwnerTeamName,
    stage3SelectionTimeoutNotice,
    stage4QuestionIndex,
    stage4QuestionCount,
    competitionFrozen,
    loading: gameFlowLoading,
    error,
    lockedStageKey,
  } = gameFlow;

  useQuestionBankRuntimeSync();
  useCompetitionContentSync();
  useCompetitionReauthGuard(true);

  const {
    teams: stage3Teams,
    loading: stage3RankingLoading,
    error: stage3RankingError,
  } = useStage3Ranking(status?.startsWith("stage3_") === true);

  const {
    displayStatus,
    stage1Complete,
    stage2Complete,
    stage3Complete,
    stage4Complete,
    progressLoading: stageEarlyFinishLoading,
  } = useTeamStageEarlyFinish(status);

  const { roles: stage2Roles, progress: stage2Progress } = useTeamStage2Progress();

  const layoutStatus = displayStatus ?? status;
  const shellScrollable = shouldScrollTeamShellContent(layoutStatus, gameFlowLoading);

  const view = useTeamShellView({
    status,
    loading: gameFlowLoading,
    error,
    lockedStageKey,
    stage1Complete,
    stage2Complete,
    stage3Complete,
    stage4Complete,
    stageEarlyFinishLoading,
  });

  const hideStage2FieldWaitingHeader =
    !gameFlowLoading &&
    !error &&
    isTeamStage2FieldWaiting(status, stage2Progress, stage2Roles.locked === true);

  return (
    <CompetitionGradientShell
      centerContent={shouldCenterTeamShellContent(layoutStatus, gameFlowLoading)}
      scrollable={shellScrollable}
      className={cn(
        "team-player-shell",
        shellScrollable ? "app-flow-shell" : "app-viewport-fill",
      )}
      contentClassName={
        gameFlowLoading
          ? "app-loading-screen__content"
          : getTeamShellContentClassName(layoutStatus)
      }
    >
      <CompetitionStage3Automation />
      <CompetitionFrozenBanner frozen={competitionFrozen} />
      <TeamFlowContent
        status={layoutStatus}
        loading={gameFlowLoading}
        hideHeader={hideStage2FieldWaitingHeader}
      >
        <TeamShellScreens
          status={status}
          currentStage={currentStage}
          loading={gameFlowLoading}
          error={error}
          lockedStageKey={lockedStageKey}
          view={view}
          stage3={{
            activeQuestion: stage3ActiveQuestion,
            openedQuestionIds: stage3OpenedQuestionIds,
            usedQuestionIds: stage3UsedQuestionIds,
            ownerTeamId: stage3OwnerTeamId,
            ownerTeamName: stage3OwnerTeamName,
            selectionTimeoutNotice: stage3SelectionTimeoutNotice,
            rankingTeams: stage3Teams,
            rankingLoading: stage3RankingLoading,
            rankingError: stage3RankingError,
          }}
          stage4={{
            questionIndex: stage4QuestionIndex,
            questionCount: stage4QuestionCount,
          }}
        />
      </TeamFlowContent>
    </CompetitionGradientShell>
  );
}

export function TeamShell() {
  return (
    <AuthGate allowedRoles={["team"]}>
      <TeamShellAuthenticated />
    </AuthGate>
  );
}
