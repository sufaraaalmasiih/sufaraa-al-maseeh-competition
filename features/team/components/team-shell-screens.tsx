"use client";

import { ErrorState, LoadingState } from "@/components/layout/state-view";
import {
  renderTeamDedicatedScreen,
  renderTeamGameplayScreens,
} from "@/features/team/components/team-screen-registry";
import type { TeamShellScreensProps } from "@/features/team/components/team-shell-screen-types";

export type {
  TeamShellScreensProps,
  TeamShellStage3Context,
  TeamShellStage4Context,
} from "@/features/team/components/team-shell-screen-types";

function TeamShellGameplayScreens(props: TeamShellScreensProps) {
  const { loading, error } = props;

  if (loading) {
    return (
      <LoadingState
        variant="page"
        title="جاري تحميل المسابقة..."
        waitingComponent="TeamShell:useGameFlow"
      />
    );
  }

  if (error) {
    return <ErrorState title="تعذر تحميل سير المسابقة" description={error} />;
  }

  return renderTeamGameplayScreens(props);
}

export function TeamShellScreens(props: TeamShellScreensProps) {
  const { view, lockedStageKey } = props;
  const dedicatedScreen = renderTeamDedicatedScreen(view, lockedStageKey);

  if (dedicatedScreen !== undefined) {
    return dedicatedScreen;
  }

  return <TeamShellGameplayScreens {...props} />;
}
