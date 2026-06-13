"use client";

import { lazy, Suspense, useEffect } from "react";
import { usePathname } from "next/navigation";
import { ErrorState, LoadingState } from "@/components/layout/state-view";
import { CompetitionGradientShell } from "@/components/layout/competition-gradient-shell";
import { AuthGate } from "@/features/auth/components/auth-gate";
import { GameFlowPlaceholder } from "@/features/gameflow/components/gameflow-placeholder";
import { gameFlowLabels } from "@/features/gameflow/gameflow-copy";
import { useTeamGameFlow } from "@/features/team/use-team-game-flow";
import { TeamStageLockedScreen } from "@/features/team/components/team-stage-locked-screen";
import { realLoadingDebug } from "@/lib/real-loading-debug";
import { TeamStage1IntroScreen } from "@/features/team/components/team-stage1-intro-screen";
import { Stage1TeamFinishedScreen } from "@/features/stage1/components/stage1-team-finished-screen";
import { Stage2TeamFinishedScreen } from "@/features/stage2/components/stage2-team-finished-screen";
import { Stage2IntroScreen } from "@/features/stage2/components/stage2-intro-screen";
import { Stage2ReadingScreen } from "@/features/stage2/components/stage2-reading-screen";
import { Stage2RoleAssignmentScreen } from "@/features/stage2/components/stage2-role-assignment-screen";
import { isStage3Status } from "@/features/stage3/stage3-constants";
import { Stage3IntroScreen } from "@/features/stage3/components/stage3-intro-screen";
import { Stage3TeamBoardScreen } from "@/features/stage3/components/stage3-team-board-screen";
import { Stage3FinishedScreen } from "@/features/stage3/components/stage3-finished-screen";
import { Stage3RankingTable } from "@/features/stage3/components/stage3-ranking-table";
import { Stage3TeamQuestionOpenScreen } from "@/features/stage3/components/stage3-team-question-open-screen";
import { Stage3TeamRevealScreen } from "@/features/stage3/components/stage3-team-reveal-screen";
import { Stage3TeamWaitingScreen } from "@/features/stage3/components/stage3-team-waiting-screen";
import { Stage3TeamPlaceholderScreen } from "@/features/stage3/components/stage3-team-placeholder-screen";
import { useStage3Ranking } from "@/features/stage3/use-stage3-ranking";
import { isStage4Status } from "@/features/stage4/stage4-constants";
import { Stage4IntroScreen } from "@/features/stage4/components/stage4-intro-screen";
import { Stage4FinishedScreen } from "@/features/stage4/components/stage4-finished-screen";
import { Stage4TeamQuestionScreen } from "@/features/stage4/components/stage4-team-question-screen";
import { Stage4TeamRevealScreen } from "@/features/stage4/components/stage4-team-reveal-screen";
import { Stage4WaitingScreen } from "@/features/stage4/components/stage4-waiting-screen";
import { STAGE4_NAME } from "@/features/stage4/stage4-constants";
import { TeamCompetitionIntroScreen } from "@/features/team/components/team-competition-intro-screen";
import { TeamFinalResultsScreen } from "@/features/team/components/team-final-results-screen";
import { TeamPodiumScreen } from "@/features/team/components/team-podium-screen";
import { TeamWaitingScreen } from "@/features/team/components/team-waiting-screen";
import type { GameFlowStatus } from "@/types";

const Stage1RunningScreen = lazy(() =>
  import("@/features/stage1/components/stage1-running-screen").then((module) => ({
    default: module.Stage1RunningScreen,
  })),
);

const Stage2PlayerTurnsScreen = lazy(() =>
  import("@/features/stage2/components/stage2-player-turns-screen").then((module) => ({
    default: module.Stage2PlayerTurnsScreen,
  })),
);

const STAGE_INTRO_STATUSES = new Set<GameFlowStatus>([
  "stage2_intro",
  "stage3_intro",
  "stage4_intro",
]);

const CENTERED_STAGE_STATUSES = new Set<GameFlowStatus>([
  "stage1_finished",
  "stage2_finished",
  "stage3_finished",
  "stage4_finished",
  "stage4_waiting_question",
  "stage4_answers_closed",
  "final_results",
  "podium",
]);

function getTeamShellContentClassName(
  status: GameFlowStatus | null | undefined,
  isArenaGameplay: boolean,
): string | undefined {
  if (!status || status === "waiting_players") {
    return undefined;
  }
  if (status === "competition_intro") {
    return "competition-intro-screen__wrap px-4 py-8";
  }
  if (status === "stage1_intro") {
    return "stage1-intro-screen__wrap";
  }
  if (STAGE_INTRO_STATUSES.has(status) || CENTERED_STAGE_STATUSES.has(status)) {
    return "px-4 py-6";
  }
  if (isArenaGameplay) {
    return "content-shell-arena px-2 py-4 sm:px-3";
  }
  return "content-shell px-4 py-8";
}

export function TeamShell() {
  const pathname = usePathname();
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
    loading: gameFlowLoading,
    error,
    lockedStageKey,
  } = useTeamGameFlow();
  const {
    teams: stage3Teams,
    loading: stage3RankingLoading,
    error: stage3RankingError,
  } = useStage3Ranking();

  useEffect(() => {
    realLoadingDebug("TeamShell", "mounted", { pathname });
  }, [pathname]);

  useEffect(() => {
    const renderBranch = gameFlowLoading
      ? "loading"
      : error
        ? "error"
        : status === "stage1_running"
          ? "stage1_running"
          : status === "stage2_player_turns"
            ? "stage2_player_turns"
            : status ?? "unknown";

    realLoadingDebug("TeamShell", "state update", {
      pathname,
      gameFlowLoading,
      gameFlowStatus: status,
      gameFlowError: error,
      selectedRenderBranch: renderBranch,
      stage3RankingLoading,
    });
  }, [currentStage, error, gameFlowLoading, pathname, stage3RankingLoading, status]);

  const isStage3Gameplay =
    status === "stage3_board" ||
    status === "stage3_question_open" ||
    status === "stage3_answer_closed" ||
    status === "stage3_reveal" ||
    status === "stage3_results_done";

  const isStage4Gameplay =
    status === "stage4_question_open" ||
    status === "stage4_reveal";

  const isArenaGameplay =
    status === "stage1_running" ||
    status === "stage2_reading" ||
    status === "stage2_player_turns" ||
    isStage3Gameplay ||
    isStage4Gameplay;

  const showWaitingScreen =
    !gameFlowLoading && !error && status === "waiting_players";
  const showCompetitionIntro =
    !gameFlowLoading && !error && status === "competition_intro";
  const showStage1Intro =
    !gameFlowLoading && !error && status === "stage1_intro";
  const showCenteredScreen =
    showWaitingScreen ||
    showCompetitionIntro ||
    showStage1Intro ||
    (!gameFlowLoading &&
      !error &&
      !!status &&
      (STAGE_INTRO_STATUSES.has(status) || CENTERED_STAGE_STATUSES.has(status)));

  return (
    <AuthGate allowedRoles={["team"]}>
      <CompetitionGradientShell
        centerContent={showCenteredScreen}
        contentClassName={getTeamShellContentClassName(status, isArenaGameplay)}
      >
        {showWaitingScreen ? (
          <TeamWaitingScreen />
        ) : showCompetitionIntro ? (
          <TeamCompetitionIntroScreen />
        ) : showStage1Intro ? (
          <TeamStage1IntroScreen />
        ) : !gameFlowLoading && !error && lockedStageKey ? (
          <TeamStageLockedScreen stageKey={lockedStageKey} />
        ) : (
        <>
          {gameFlowLoading ? (
            <LoadingState waitingComponent="TeamShell:useGameFlow" />
          ) : null}
          {error ? <ErrorState title="تعذر تحميل سير المسابقة" description={error} /> : null}
          {!gameFlowLoading && !error && status === "stage1_running" ? (
            <Suspense
              fallback={
                <LoadingState waitingComponent="TeamShell:Stage1RunningScreen Suspense" />
              }
            >
              <Stage1RunningScreen />
            </Suspense>
          ) : null}
          {!gameFlowLoading && !error && status === "stage1_finished" ? (
            <Stage1TeamFinishedScreen />
          ) : null}
          {!gameFlowLoading && !error && status === "stage2_intro" ? (
            <Stage2IntroScreen />
          ) : null}
          {!gameFlowLoading && !error && status === "stage2_role_assignment" ? (
            <Stage2RoleAssignmentScreen />
          ) : null}
          {!gameFlowLoading && !error && status === "stage2_reading" ? (
            <Stage2ReadingScreen />
          ) : null}
          {!gameFlowLoading && !error && status === "stage2_player_turns" ? (
            <Suspense
              fallback={
                <LoadingState waitingComponent="TeamShell:Stage2PlayerTurnsScreen Suspense" />
              }
            >
              <Stage2PlayerTurnsScreen />
            </Suspense>
          ) : null}
          {!gameFlowLoading && !error && status === "stage2_finished" ? (
            <Stage2TeamFinishedScreen />
          ) : null}
          {!gameFlowLoading && !error && status === "stage3_board" ? (
            <>
              <Stage3TeamBoardScreen
                openedQuestionIds={stage3OpenedQuestionIds}
                usedQuestionIds={stage3UsedQuestionIds}
                ownerTeamId={stage3OwnerTeamId}
                ownerTeamName={stage3OwnerTeamName}
                selectionTimeoutNotice={stage3SelectionTimeoutNotice}
              />
              <Stage3RankingTable
                teams={stage3Teams}
                loading={stage3RankingLoading}
                error={stage3RankingError}
                variant="team"
              />
            </>
          ) : null}
          {!gameFlowLoading && !error && status === "stage3_question_open" ? (
            <Stage3TeamQuestionOpenScreen />
          ) : null}
          {!gameFlowLoading && !error && status === "stage3_answer_closed" ? (
            <Stage3TeamWaitingScreen
              variant="answer_closed"
              question={stage3ActiveQuestion}
              ownerTeamName={stage3OwnerTeamName}
            />
          ) : null}
          {!gameFlowLoading && !error && status === "stage3_reveal" ? (
            <Stage3TeamRevealScreen question={stage3ActiveQuestion} />
          ) : null}
          {!gameFlowLoading && !error && status === "stage3_results_done" ? (
            <>
              <Stage3TeamRevealScreen question={stage3ActiveQuestion} />
              <Stage3RankingTable
                teams={stage3Teams}
                loading={stage3RankingLoading}
                error={stage3RankingError}
                variant="team"
              />
            </>
          ) : null}
          {!gameFlowLoading && !error && status === "stage3_intro" ? (
            <Stage3IntroScreen />
          ) : null}
          {!gameFlowLoading && !error && status === "stage3_finished" ? (
            <Stage3FinishedScreen variant="team" />
          ) : null}
          {!gameFlowLoading && !error && status === "stage4_intro" ? (
            <Stage4IntroScreen />
          ) : null}
          {!gameFlowLoading && !error && status === "stage4_waiting_question" ? (
            <Stage4WaitingScreen
              questionIndex={stage4QuestionIndex}
              questionCount={stage4QuestionCount}
              variant="team"
            />
          ) : null}
          {!gameFlowLoading && !error && status === "stage4_question_open" ? (
            <Stage4TeamQuestionScreen />
          ) : null}
          {!gameFlowLoading && !error && status === "stage4_answers_closed" ? (
            <section className="competition-stage-screen">
              <div className="competition-stage-screen__card glass-card-white">
                <span className="competition-stage-screen__badge competition-stage-screen__badge--blue">
                  {STAGE4_NAME}
                </span>
                <h2 className="competition-stage-screen__title">تم إغلاق الإجابات</h2>
                <p className="competition-stage-screen__subtitle">بانتظار إعلان النتيجة</p>
                <div className="competition-stage-screen__wait">
                  <span aria-hidden className="competition-stage-screen__wait-pulse" />
                  <p className="competition-stage-screen__wait-title">بانتظار الإعلان</p>
                  <p className="competition-stage-screen__wait-hint">
                    السؤال {Math.min(stage4QuestionIndex + 1, stage4QuestionCount)} من{" "}
                    {stage4QuestionCount}
                  </p>
                </div>
              </div>
            </section>
          ) : null}
          {!gameFlowLoading && !error && status === "stage4_reveal" ? (
            <Stage4TeamRevealScreen />
          ) : null}
          {!gameFlowLoading && !error && status === "stage4_finished" ? (
            <Stage4FinishedScreen variant="team" />
          ) : null}
          {!gameFlowLoading && !error && status === "final_results" ? (
            <TeamFinalResultsScreen />
          ) : null}
          {!gameFlowLoading && !error && status === "podium" ? (
            <TeamPodiumScreen />
          ) : null}
          {!gameFlowLoading &&
          !error &&
          status &&
          isStage3Status(status) &&
          status !== "stage3_intro" &&
          status !== "stage3_board" &&
          status !== "stage3_question_open" &&
          status !== "stage3_answer_closed" &&
          status !== "stage3_reveal" &&
          status !== "stage3_results_done" &&
          status !== "stage3_finished" ? (
            <Stage3TeamPlaceholderScreen status={status} currentStage={currentStage} />
          ) : null}
          {!gameFlowLoading &&
          !error &&
          status &&
          status !== "stage1_running" &&
          status !== "stage1_finished" &&
          status !== "stage2_intro" &&
          status !== "stage2_role_assignment" &&
          status !== "stage2_reading" &&
          status !== "stage2_player_turns" &&
          status !== "stage2_finished" &&
          status !== "waiting_players" &&
          status !== "competition_intro" &&
          status !== "stage1_intro" &&
          status !== "final_results" &&
          status !== "podium" &&
          !isStage3Status(status) &&
          !(status && isStage4Status(status)) ? (
            <GameFlowPlaceholder title={gameFlowLabels[status]} />
          ) : null}
        </>
        )}
      </CompetitionGradientShell>
    </AuthGate>
  );
}
