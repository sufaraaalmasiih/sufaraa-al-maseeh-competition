import {
  getCompetitionShellContentClassName,
  isArenaGameplayStatus,
  shouldCenterCompetitionShellContent,
  shouldScrollCompetitionShellContent,
} from "@/features/gameflow/flow-shell-layout";
import type { GameFlowStatus } from "@/types";

export function getAudienceShellContentClassName(
  status: GameFlowStatus | null | undefined,
): string | undefined {
  if (!status || status === "waiting_players") {
    return "audience-waiting-screen__content";
  }

  if (status === "competition_intro") {
    return "audience-intro-screen__wrap";
  }

  if (
    status === "stage1_running" ||
    status === "stage2_role_assignment" ||
    status === "stage2_player_turns"
  ) {
    return "audience-live-screen__wrap";
  }

  const base = getCompetitionShellContentClassName(status);
  if (!base) {
    return base;
  }

  if (
    status === "stage1_intro" ||
    status === "stage2_intro" ||
    status === "stage3_intro" ||
    status === "stage4_intro"
  ) {
    return "audience-flow-shell__wrap";
  }

  if (base === "competition-centered-screen__wrap") {
    return "audience-centered-screen__wrap";
  }

  if (base.includes("content-shell-arena")) {
    return `${base} audience-arena-shell__wrap`;
  }

  if (status === "stage2_reading") {
    return "audience-reading-screen__wrap";
  }

  return base;
}

export function shouldCenterAudienceShellContent(
  status: GameFlowStatus | null | undefined,
  loading: boolean,
): boolean {
  return shouldCenterCompetitionShellContent(status, loading);
}

export function shouldScrollAudienceShellContent(
  status: GameFlowStatus | null | undefined,
  loading: boolean,
): boolean {
  if (loading || !status || status === "waiting_players") {
    return false;
  }

  if (
    isArenaGameplayStatus(status) ||
    status === "stage1_running" ||
    status === "stage2_role_assignment" ||
    status === "stage2_player_turns"
  ) {
    return false;
  }

  return shouldScrollCompetitionShellContent(status, loading);
}
