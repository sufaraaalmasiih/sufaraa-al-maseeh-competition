"use client";

import type { ReactNode } from "react";
import type { AdminStageKey } from "@/features/facilitator/facilitator-team-admin";
import { GameFlowPlaceholder } from "@/features/gameflow/components/gameflow-placeholder";
import { gameFlowLabels } from "@/features/gameflow/gameflow-copy";
import {
  shouldShowGlobalPlaceholder,
  shouldShowStage3Placeholder,
} from "@/features/gameflow/gameflow-shell-guards";
import { Stage1RunningScreen } from "@/features/stage1/components/stage1-running-screen";
import { Stage1TeamFinishedScreen } from "@/features/stage1/components/stage1-team-finished-screen";
import { Stage2PlayerTurnsScreen } from "@/features/stage2/components/stage2-player-turns-screen";
import { Stage2RoleAssignmentScreen } from "@/features/stage2/components/stage2-role-assignment-screen";
import { Stage2ReadingScreen } from "@/features/stage2/components/stage2-reading-screen";
import { Stage2TeamFinishedScreen } from "@/features/stage2/components/stage2-team-finished-screen";
import { Stage3FinishedScreen } from "@/features/stage3/components/stage3-finished-screen";
import { Stage3RankingTable } from "@/features/stage3/components/stage3-ranking-table";
import { Stage3TeamBoardScreen } from "@/features/stage3/components/stage3-team-board-screen";
import { Stage3TeamPlaceholderScreen } from "@/features/stage3/components/stage3-team-placeholder-screen";
import { Stage3TeamQuestionOpenScreen } from "@/features/stage3/components/stage3-team-question-open-screen";
import { Stage3TeamRevealScreen } from "@/features/stage3/components/stage3-team-reveal-screen";
import { Stage3TeamWaitingScreen } from "@/features/stage3/components/stage3-team-waiting-screen";
import { Stage4AnswersClosedScreen } from "@/features/stage4/components/stage4-answers-closed-screen";
import { Stage4FinishedScreen } from "@/features/stage4/components/stage4-finished-screen";
import { Stage4TeamQuestionScreen } from "@/features/stage4/components/stage4-team-question-screen";
import { Stage4TeamRevealScreen } from "@/features/stage4/components/stage4-team-reveal-screen";
import { Stage4WaitingScreen } from "@/features/stage4/components/stage4-waiting-screen";
import { TeamCompetitionIntroScreen } from "@/features/team/components/team-competition-intro-screen";
import { TeamFinalResultsScreen } from "@/features/team/components/team-final-results-screen";
import { TeamPodiumScreen } from "@/features/team/components/team-podium-screen";
import { TeamStage1IntroScreen } from "@/features/team/components/team-stage1-intro-screen";
import { TeamStageIntroScreen } from "@/features/team/components/team-stage-intro-screen";
import { TeamStageLockedScreen } from "@/features/team/components/team-stage-locked-screen";
import type { TeamShellScreensProps } from "@/features/team/components/team-shell-screen-types";
import type { TeamShellViewState } from "@/features/team/components/use-team-shell-view";
import { TeamWaitingScreen } from "@/features/team/components/team-waiting-screen";

interface TeamDedicatedScreenEntry {
  match: (view: TeamShellViewState, lockedStageKey: AdminStageKey | null) => boolean;
  render: (lockedStageKey: AdminStageKey | null) => ReactNode;
}

const TEAM_DEDICATED_SCREEN_ENTRIES: TeamDedicatedScreenEntry[] = [
  {
    match: (view) => view.showWaitingScreen,
    render: () => <TeamWaitingScreen />,
  },
  {
    match: (view) => view.showCompetitionIntro,
    render: () => <TeamCompetitionIntroScreen />,
  },
  {
    match: (view) => view.showStage1Intro,
    render: () => <TeamStage1IntroScreen />,
  },
  {
    match: (view) => view.showStage2RoleAssignment,
    render: () => <Stage2RoleAssignmentScreen />,
  },
  {
    match: (view) => view.showStage2Reading,
    render: () => <Stage2ReadingScreen />,
  },
  {
    match: (view) => view.showStage4Intro,
    render: () => <TeamStageIntroScreen stage="stage4" />,
  },
  {
    match: (view, lockedStageKey) => view.showLockedStage && Boolean(lockedStageKey),
    render: (lockedStageKey) => (
      <TeamStageLockedScreen stageKey={lockedStageKey as AdminStageKey} />
    ),
  },
];

export function renderTeamDedicatedScreen(
  view: TeamShellViewState,
  lockedStageKey: AdminStageKey | null,
): ReactNode | undefined {
  const entry = TEAM_DEDICATED_SCREEN_ENTRIES.find((item) => item.match(view, lockedStageKey));
  return entry ? entry.render(lockedStageKey) : undefined;
}

export function renderTeamGameplayScreens(props: TeamShellScreensProps): ReactNode {
  const { status, currentStage, view, stage3, stage4 } = props;

  return (
    <>
      {view.showStage1Running ? <Stage1RunningScreen /> : null}

      {view.showStage1Finished ? <Stage1TeamFinishedScreen /> : null}

      {status === "stage2_intro" ? <TeamStageIntroScreen stage="stage2" /> : null}

      {view.showStage2PlayerTurns ? <Stage2PlayerTurnsScreen /> : null}

      {view.showStage2Finished ? <Stage2TeamFinishedScreen /> : null}

      {view.showStage3ActiveGameplay && status === "stage3_board" ? (
        <Stage3TeamBoardScreen
          openedQuestionIds={stage3.openedQuestionIds}
          usedQuestionIds={stage3.usedQuestionIds}
          ownerTeamId={stage3.ownerTeamId}
          ownerTeamName={stage3.ownerTeamName}
          selectionTimeoutNotice={stage3.selectionTimeoutNotice}
        />
      ) : null}

      {view.showStage3ActiveGameplay && status === "stage3_question_open" ? (
        <Stage3TeamQuestionOpenScreen />
      ) : null}

      {view.showStage3ActiveGameplay && status === "stage3_answer_closed" ? (
        <Stage3TeamWaitingScreen
          variant="answer_closed"
          question={stage3.activeQuestion}
          ownerTeamName={stage3.ownerTeamName}
        />
      ) : null}

      {view.showStage3ActiveGameplay && status === "stage3_reveal" ? (
        <Stage3TeamRevealScreen
          question={stage3.activeQuestion}
          ownerTeamName={stage3.ownerTeamName}
        />
      ) : null}

      {view.showStage3ActiveGameplay && status === "stage3_results_done" ? (
        <>
          <Stage3TeamRevealScreen
            question={stage3.activeQuestion}
            ownerTeamName={stage3.ownerTeamName}
          />
          <Stage3RankingTable
            teams={stage3.rankingTeams}
            loading={stage3.rankingLoading}
            error={stage3.rankingError}
            variant="team"
          />
        </>
      ) : null}

      {status === "stage3_intro" ? <TeamStageIntroScreen stage="stage3" /> : null}

      {view.showStage3Finished ? <Stage3FinishedScreen variant="team" /> : null}

      {view.showStage4ActiveGameplay && status === "stage4_waiting_question" ? (
        <Stage4WaitingScreen
          questionIndex={stage4.questionIndex}
          questionCount={stage4.questionCount}
          variant="team"
        />
      ) : null}

      {view.showStage4ActiveGameplay && status === "stage4_question_open" ? (
        <Stage4TeamQuestionScreen />
      ) : null}

      {view.showStage4ActiveGameplay && status === "stage4_answers_closed" ? (
        <Stage4AnswersClosedScreen
          questionIndex={stage4.questionIndex}
          questionCount={stage4.questionCount}
          variant="team"
        />
      ) : null}

      {view.showStage4ActiveGameplay && status === "stage4_reveal" ? (
        <Stage4TeamRevealScreen />
      ) : null}

      {view.showStage4Finished ? <Stage4FinishedScreen variant="team" /> : null}

      {status === "final_results" ? <TeamFinalResultsScreen /> : null}

      {status === "podium" ? <TeamPodiumScreen /> : null}

      {status && shouldShowStage3Placeholder(status, "team") ? (
        <Stage3TeamPlaceholderScreen status={status} currentStage={currentStage ?? null} />
      ) : null}

      {status && shouldShowGlobalPlaceholder(status, "team") ? (
        <GameFlowPlaceholder title={gameFlowLabels[status]} />
      ) : null}
    </>
  );
}

export const TEAM_TERMINAL_STATUS_SCREENS = {
  final_results: true,
  podium: true,
} as const;
