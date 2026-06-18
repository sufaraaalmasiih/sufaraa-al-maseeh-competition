"use client";

import { Suspense } from "react";
import { TeamShell } from "@/features/team/components/team-shell";

export default function TeamPage() {
  return (
    <Suspense fallback={null}>
      <TeamShell />
    </Suspense>
  );
}
