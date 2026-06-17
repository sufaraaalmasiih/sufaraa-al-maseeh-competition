"use client";

import dynamic from "next/dynamic";
import { LoadingState } from "@/components/layout/state-view";

const AudienceShell = dynamic(
  () =>
    import("@/features/audience/components/audience-shell").then((module) => ({
      default: module.AudienceShell,
    })),
  {
    loading: () => <LoadingState variant="page" />,
  },
);

export default function AudiencePage() {
  return <AudienceShell />;
}
