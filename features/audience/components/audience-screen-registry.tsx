"use client";

import type { ReactNode } from "react";
import { AudienceCompetitionIntroScreen } from "@/features/audience/components/audience-competition-intro-screen";
import { AudienceFinalResultsScreen } from "@/features/audience/components/audience-final-results-screen";
import { AudiencePodiumScreen } from "@/features/audience/components/audience-podium-screen";
import { AudienceStageIntroScreen } from "@/features/audience/components/audience-stage-intro-screen";
import { AudienceWaitingPlayersScreen } from "@/features/audience/components/audience-waiting-players-screen";
import { AudienceStage1Finished } from "@/features/audience/components/audience-stage1-finished";
import { AudienceStage1Running } from "@/features/audience/components/audience-stage1-running";
import { AudienceStage2Finished } from "@/features/audience/components/audience-stage2-finished";
import { AudienceStage2Reading } from "@/features/audience/components/audience-stage2-reading";
import { AudienceStage2Running } from "@/features/audience/components/audience-stage2-running";
import type { AudienceShellScreensProps } from "@/features/audience/components/audience-shell-screen-types";
import {
  resolveGameFlowScreen,
  type GameFlowScreenRegistry,
} from "@/features/gameflow/gameflow-screen-registry";
import { Stage3AudienceBoardScreen } from "@/features/stage3/components/stage3-audience-board-screen";
import { Stage3AudienceRevealScreen } from "@/features/stage3/components/stage3-audience-reveal-screen";
import { Stage3AudienceWaitingScreen } from "@/features/stage3/components/stage3-audience-waiting-screen";
import { Stage3FinishedScreen } from "@/features/stage3/components/stage3-finished-screen";
import { Stage3QuestionOpenScreen } from "@/features/stage3/components/stage3-question-open-screen";
import { Stage4AnswersClosedScreen } from "@/features/stage4/components/stage4-answers-closed-screen";
import { Stage4AudienceQuestionScreen } from "@/features/stage4/components/stage4-audience-question-screen";
import { Stage4AudienceRevealScreen } from "@/features/stage4/components/stage4-audience-reveal-screen";
import { Stage4FinishedScreen } from "@/features/stage4/components/stage4-finished-screen";
import { Stage4WaitingScreen } from "@/features/stage4/components/stage4-waiting-screen";
import type { GameFlowStatus } from "@/types";

export const AUDIENCE_SCREEN_REGISTRY: GameFlowScreenRegistry<AudienceShellScreensProps> = {
  waiting_players: () => <AudienceWaitingPlayersScreen />,
  competition_intro: () => <AudienceCompetitionIntroScreen />,
  stage1_intro: () => <AudienceStageIntroScreen stage="stage1" />,
  stage1_running: () => <AudienceStage1Running />,
  stage1_finished: () => <AudienceStage1Finished />,
  stage2_intro: () => <AudienceStageIntroScreen stage="stage2" />,
  stage2_role_assignment: () => <AudienceStage2Running phase="role_assignment" />,
  stage2_reading: () => <AudienceStage2Reading />,
  stage2_player_turns: () => <AudienceStage2Running phase="player_turns" />,
  stage2_finished: () => <AudienceStage2Finished />,
  stage3_board: ({ stage3 }) => (
    <Stage3AudienceBoardScreen
      openedQuestionIds={stage3.openedQuestionIds}
      usedQuestionIds={stage3.usedQuestionIds}
      ownerTeamName={stage3.ownerTeamName}
      selectionTimeoutNotice={stage3.selectionTimeoutNotice}
    />
  ),
  stage3_question_open: ({ stage3 }) => (
    <div className="stage3-scene stage3-scene--question-open audience-stage3-question-layout">
      <div className="audience-stage3-question-card">
        <Stage3QuestionOpenScreen
          question={stage3.activeQuestion}
          ownerTeamName={stage3.ownerTeamName}
          variant="audience"
        />
      </div>
    </div>
  ),
  stage3_answer_closed: ({ stage3 }) => (
    <Stage3AudienceWaitingScreen
      variant="answer_closed"
      question={stage3.activeQuestion}
      ownerTeamName={stage3.ownerTeamName}
    />
  ),
  stage3_reveal: ({ stage3 }) => (
    <Stage3AudienceRevealScreen
      question={stage3.activeQuestion}
      ownerTeamName={stage3.ownerTeamName}
      rankingTeams={stage3.rankingTeams}
      rankingLoading={stage3.rankingLoading}
      rankingError={stage3.rankingError}
    />
  ),
  stage3_results_done: ({ stage3 }) => (
    <Stage3AudienceWaitingScreen
      variant="results_done"
      question={stage3.activeQuestion}
      ownerTeamName={stage3.ownerTeamName}
      rankingTeams={stage3.rankingTeams}
      rankingLoading={stage3.rankingLoading}
      rankingError={stage3.rankingError}
    />
  ),
  stage3_finished: () => <Stage3FinishedScreen variant="audience" />,
  stage3_intro: () => <AudienceStageIntroScreen stage="stage3" />,
  stage4_intro: () => <AudienceStageIntroScreen stage="stage4" />,
  stage4_waiting_question: ({ stage4 }) => (
    <Stage4WaitingScreen
      questionIndex={stage4.questionIndex}
      questionCount={stage4.questionCount}
      variant="audience"
    />
  ),
  stage4_question_open: () => <Stage4AudienceQuestionScreen />,
  stage4_answers_closed: ({ stage4 }) => (
    <Stage4AnswersClosedScreen
      questionIndex={stage4.questionIndex}
      questionCount={stage4.questionCount}
      variant="audience"
    />
  ),
  stage4_reveal: () => <Stage4AudienceRevealScreen />,
  stage4_finished: () => <Stage4FinishedScreen variant="audience" />,
  final_results: () => <AudienceFinalResultsScreen />,
  podium: () => <AudiencePodiumScreen />,
};

export function renderAudienceRegistryScreen(
  status: GameFlowStatus,
  props: AudienceShellScreensProps,
): ReactNode | undefined {
  return resolveGameFlowScreen(AUDIENCE_SCREEN_REGISTRY, status, props);
}
