"use client";

import { FlowScreenTransition } from "@/components/motion/flow-screen-transition";
import { GameplayHeaderCard } from "@/components/competition/gameplay-header-card";
import {
  getFlowTransitionKey,
  getFlowTransitionVariant,
  shouldUseInstantFlowTransition,
} from "@/features/gameflow/flow-transition-policy";
import {
  shouldCenterFlowBody,
  shouldFillFlowViewport,
  shouldShowGameplayFlowHeader,
} from "@/features/gameflow/flow-content-header";
import { cn } from "@/lib/utils";
import type { GameFlowStatus } from "@/types";

interface TeamFlowContentProps {
  status: GameFlowStatus | null | undefined;
  loading?: boolean;
  hideHeader?: boolean;
  children: React.ReactNode;
}

export function TeamFlowContent({ status, loading, hideHeader, children }: TeamFlowContentProps) {
  const showHeader = !hideHeader && shouldShowGameplayFlowHeader(status, loading);
  const transitionKey = getFlowTransitionKey(status);
  const fillViewport = shouldFillFlowViewport(status, loading);
  const centerBody = shouldCenterFlowBody(status);
  const instant = shouldUseInstantFlowTransition(status, "team", loading);

  return (
    <div
      className={cn(
        "team-flow-content",
        fillViewport && "team-flow-content--fill",
        centerBody && "team-flow-content--center-body",
      )}
    >
      {showHeader ? (
        <div className="team-flow-content__header">
          <GameplayHeaderCard />
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
