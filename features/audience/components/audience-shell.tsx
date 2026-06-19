"use client";

import { CompetitionGradientShell } from "@/components/layout/competition-gradient-shell";
import { CompetitionFrozenBanner } from "@/components/layout/competition-frozen-banner";
import { isAudienceEmbeddedView } from "@/features/audience/audience-display-utils";
import { AudienceFlowContent } from "@/features/audience/components/audience-flow-content";
import {
  getAudienceShellContentClassName,
  shouldCenterAudienceShellContent,
  shouldScrollAudienceShellContent,
} from "@/features/audience/components/audience-shell-layout";
import { AudienceShellScreens } from "@/features/audience/components/audience-shell-screens";
import { AudienceFullscreenPrompt } from "@/features/audience/components/audience-fullscreen-prompt";
import { useAudienceShellData } from "@/features/audience/use-audience-shell-data";
import { useGameFlow } from "@/features/gameflow/use-game-flow";

export function AudienceShell() {
  const embedded = isAudienceEmbeddedView();
  const { competitionFrozen } = useGameFlow();
  const data = useAudienceShellData();
  const { status, loading } = data;
  const shellScrollable = shouldScrollAudienceShellContent(status, loading);

  return (
    <CompetitionGradientShell
      centerContent={shouldCenterAudienceShellContent(status, loading)}
      scrollable={shellScrollable}
      className={embedded ? undefined : shellScrollable ? "app-flow-shell" : "app-viewport-fill"}
      contentClassName={
        loading ? "app-loading-screen__content" : getAudienceShellContentClassName(status)
      }
    >
      {!embedded ? <AudienceFullscreenPrompt /> : null}
      <CompetitionFrozenBanner frozen={competitionFrozen} />
      <AudienceFlowContent status={status} loading={loading} embedded={embedded}>
        <AudienceShellScreens {...data} />
      </AudienceFlowContent>
    </CompetitionGradientShell>
  );
}
