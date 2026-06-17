"use client";

import {
  isStage3GameplayStatus,
  isStage4GameplayStatus,
} from "@/features/team/team-stage-early-finish";
import type { AdminStageKey } from "@/features/facilitator/facilitator-team-admin";
import type { GameFlowStatus } from "@/types";

export interface TeamShellViewInput {
  status: GameFlowStatus | null | undefined;
  loading: boolean;  error: string | null;
  lockedStageKey: AdminStageKey | null;
  stage1Complete: boolean;
  stage2Complete: boolean;
  stage3Complete: boolean;
  stage4Complete: boolean;
  stageEarlyFinishLoading: boolean;
}

export interface TeamShellViewState {
  showWaitingScreen: boolean;
  showCompetitionIntro: boolean;
  showStage1Intro: boolean;
  showStage2RoleAssignment: boolean;
  showStage2Reading: boolean;
  showStage4Intro: boolean;
  showLockedStage: boolean;
  showDedicatedScreen: boolean;
  showStage1Running: boolean;
  showStage1Finished: boolean;
  showStage2PlayerTurns: boolean;
  showStage2Finished: boolean;
  showStage3ActiveGameplay: boolean;
  showStage3Finished: boolean;
  showStage4ActiveGameplay: boolean;
  showStage4Finished: boolean;
}

function isReady(
  loading: boolean,
  error: string | null,
): boolean {
  return !loading && !error;
}

export function useTeamShellView(input: TeamShellViewInput): TeamShellViewState {
  const {
    status,
    loading,
    error,
    lockedStageKey,
    stage1Complete,
    stage2Complete,
    stage3Complete,
    stage4Complete,
    stageEarlyFinishLoading,
  } = input;

  const ready = isReady(loading, error);

  const showWaitingScreen = ready && status === "waiting_players";
  const showCompetitionIntro = ready && status === "competition_intro";
  const showStage1Intro = ready && status === "stage1_intro";
  const showStage2RoleAssignment = ready && status === "stage2_role_assignment";
  const showStage2Reading = ready && status === "stage2_reading";
  const showStage4Intro = ready && status === "stage4_intro";
  const showLockedStage = ready && Boolean(lockedStageKey);

  const showDedicatedScreen =
    showWaitingScreen ||
    showCompetitionIntro ||
    showStage1Intro ||
    showStage2RoleAssignment ||
    showStage2Reading ||
    showStage4Intro ||
    showLockedStage;

  const showStage1Running =
    ready && status === "stage1_running" && !stage1Complete && !stageEarlyFinishLoading;

  const showStage1Finished =
    ready && ((status === "stage1_running" && stage1Complete) || status === "stage1_finished");

  const showStage2PlayerTurns =
    ready &&
    status === "stage2_player_turns" &&
    !stage2Complete &&
    !stageEarlyFinishLoading;

  const showStage2Finished =
    ready && ((status === "stage2_player_turns" && stage2Complete) || status === "stage2_finished");

  const showStage3ActiveGameplay =
    ready &&
    isStage3GameplayStatus(status) &&
    !stage3Complete &&
    !stageEarlyFinishLoading;

  const showStage3Finished =
    ready &&
    ((isStage3GameplayStatus(status) && stage3Complete) || status === "stage3_finished");

  const showStage4ActiveGameplay =
    ready &&
    isStage4GameplayStatus(status) &&
    !stage4Complete &&
    !stageEarlyFinishLoading;

  const showStage4Finished =
    ready &&
    ((isStage4GameplayStatus(status) && stage4Complete) || status === "stage4_finished");

  return {
    showWaitingScreen,
    showCompetitionIntro,
    showStage1Intro,
    showStage2RoleAssignment,
    showStage2Reading,
    showStage4Intro,
    showLockedStage,
    showDedicatedScreen,
    showStage1Running,
    showStage1Finished,
    showStage2PlayerTurns,
    showStage2Finished,
    showStage3ActiveGameplay,
    showStage3Finished,
    showStage4ActiveGameplay,
    showStage4Finished,
  };
}
