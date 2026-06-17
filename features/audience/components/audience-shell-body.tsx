"use client";

import { AudienceFlowContent } from "@/features/audience/components/audience-flow-content";
import type { AudienceShellScreensProps } from "@/features/audience/components/audience-shell-screen-types";
import { AudienceShellScreens } from "@/features/audience/components/audience-shell-screens";

interface AudienceShellBodyProps {
  data: AudienceShellScreensProps;
  embedded?: boolean;
  loadingVariant?: "page" | "inline";
}

export function AudienceShellBody({
  data,
  embedded = true,
  loadingVariant,
}: AudienceShellBodyProps) {
  const { status, loading } = data;

  return (
    <AudienceFlowContent status={status} loading={loading} embedded={embedded}>
      <AudienceShellScreens {...data} loadingVariant={loadingVariant ?? data.loadingVariant} />
    </AudienceFlowContent>
  );
}
