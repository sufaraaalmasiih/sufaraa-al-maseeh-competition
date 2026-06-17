"use client";

import { FlowScreenTransition } from "@/components/motion/flow-screen-transition";
import { AudienceGameplayHeaderCard } from "@/components/competition/audience-gameplay-header-card";
import {
  getFlowTransitionKey,
  getFlowTransitionVariant,
  shouldUseInstantFlowTransition,
} from "@/features/gameflow/flow-transition-policy";
import {
  shouldAlignAudienceRevealTrack,
  shouldCenterFlowBody,
  shouldFillFlowViewport,
  shouldShowGameplayFlowHeader,
} from "@/features/gameflow/flow-content-header";
import { cn } from "@/lib/utils";
import type { GameFlowStatus } from "@/types";

interface AudienceFlowContentProps {
  status: GameFlowStatus | null | undefined;
  loading?: boolean;
  embedded?: boolean;
  children: React.ReactNode;
}

export function AudienceFlowContent({
  status,
  loading,
  embedded = false,
  children,
}: AudienceFlowContentProps) {
  const showHeader = !embedded && shouldShowGameplayFlowHeader(status, loading);
  const transitionKey = getFlowTransitionKey(status);
  const fillViewport = shouldFillFlowViewport(status, loading);
  const centerBody = shouldCenterFlowBody(status);
  const alignRevealTrack = shouldAlignAudienceRevealTrack(status);
  const instant = shouldUseInstantFlowTransition(status, "audience", loading);

  return (
    <div
      className={cn(
        "team-flow-content audience-flow-content audience-display",
        fillViewport && "team-flow-content--fill",
        centerBody && "team-flow-content--center-body",
        alignRevealTrack && "audience-flow-content--reveal-track",
      )}
    >
      {showHeader ? (
        <div className="team-flow-content__header">
          <AudienceGameplayHeaderCard />
        </div>
      ) : null}

      <FlowScreenTransition
        transitionKey={transitionKey}
        variant={getFlowTransitionVariant(status)}
        instant={instant}
        className="team-flow-content__body"
      >
        {children}
      </FlowScreenTransition>
    </div>
  );
}
