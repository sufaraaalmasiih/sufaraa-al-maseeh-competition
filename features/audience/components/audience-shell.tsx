"use client";

import { CompetitionGradientShell } from "@/components/layout/competition-gradient-shell";
import { CompetitionFrozenBanner } from "@/components/layout/competition-frozen-banner";
import { ObjectionAcceptedBanner } from "@/features/competition/components/objection-accepted-banner";
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
import { SoundToggleButton } from "@/features/competition/components/sound-toggle-button";
import { useCompetitionSoundCues } from "@/features/competition/use-competition-sound-cues";

export function AudienceShell() {
  const embedded = isAudienceEmbeddedView();
  const { competitionFrozen, objectionAcceptedNotice } = useGameFlow();
  const data = useAudienceShellData();
  const { status, loading } = data;
  const shellScrollable = shouldScrollAudienceShellContent(status, loading);

  // مؤثّرات صوتية (لا تعمل في المعاينة المضمّنة داخل تبويب الميسّر).
  useCompetitionSoundCues(status, !embedded, objectionAcceptedNotice?.key ?? null);

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
      {!embedded ? <SoundToggleButton /> : null}
      <CompetitionFrozenBanner frozen={competitionFrozen} />
      <ObjectionAcceptedBanner notice={objectionAcceptedNotice} />
      <AudienceFlowContent status={status} loading={loading} embedded={embedded}>
        <AudienceShellScreens {...data} />
      </AudienceFlowContent>
    </CompetitionGradientShell>
  );
}
