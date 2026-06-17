"use client";

import { Suspense } from "react";
import { FacilitatorShell } from "@/features/facilitator/components/facilitator-shell";
import { LoadingState } from "@/components/layout/state-view";

export default function FacilitatorPage() {
  return (
    <Suspense fallback={<LoadingState variant="page" />}>
      <FacilitatorShell />
    </Suspense>
  );
}
