"use client";

import { ErrorState, LoadingState } from "@/components/layout/state-view";
import { renderAudienceRegistryScreen } from "@/features/audience/components/audience-screen-registry";
import type { AudienceShellScreensProps } from "@/features/audience/components/audience-shell-screen-types";
import { GameFlowPlaceholder } from "@/features/gameflow/components/gameflow-placeholder";
import {
  shouldShowGlobalPlaceholder,
  shouldShowStage3Placeholder,
} from "@/features/gameflow/gameflow-shell-guards";
import { audienceGameFlowLabels } from "@/features/gameflow/gameflow-copy";
import { Stage3AudiencePlaceholder } from "@/features/stage3/components/stage3-audience-placeholder";

export type {
  AudienceShellScreensProps,
  AudienceShellStage3Context,
  AudienceShellStage4Context,
} from "@/features/audience/components/audience-shell-screen-types";

export function AudienceShellScreens(props: AudienceShellScreensProps) {
  const { status, loading, error, loadingVariant = "page" } = props;

  if (loading) {
    return <LoadingState variant={loadingVariant} />;
  }

  if (error) {
    return <ErrorState title="تعذر تحميل سير المسابقة" description={error} />;
  }

  if (!status) {
    return null;
  }

  const registryScreen = renderAudienceRegistryScreen(status, props);
  if (registryScreen !== undefined) {
    return registryScreen;
  }

  if (shouldShowStage3Placeholder(status, "audience")) {
    return <Stage3AudiencePlaceholder status={status} />;
  }

  if (shouldShowGlobalPlaceholder(status, "audience")) {
    return (
      <GameFlowPlaceholder
        variant="audience"
        title={audienceGameFlowLabels[status]}
        description="عرض جمهور متزامن مع سير المسابقة."
      />
    );
  }

  return null;
}
