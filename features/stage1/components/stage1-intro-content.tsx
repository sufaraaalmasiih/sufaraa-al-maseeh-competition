"use client";

import type { ReactNode } from "react";
import { StageIntroContent } from "@/features/stage/components/stage-intro-content";

interface Stage1IntroContentProps {
  showTeamMeta?: boolean;
  footer?: ReactNode;
}

export function Stage1IntroContent({ showTeamMeta = false, footer }: Stage1IntroContentProps) {
  return <StageIntroContent stage="stage1" showTeamMeta={showTeamMeta} footer={footer} />;
}
