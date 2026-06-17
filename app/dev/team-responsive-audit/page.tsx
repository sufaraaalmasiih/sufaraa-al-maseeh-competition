import { Suspense } from "react";
import { TeamResponsiveAuditClient } from "@/app/dev/team-responsive-audit/team-responsive-audit-client";

export default function TeamResponsiveAuditPage() {
  return (
    <Suspense fallback={null}>
      <TeamResponsiveAuditClient />
    </Suspense>
  );
}
