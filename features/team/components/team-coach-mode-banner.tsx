"use client";

import Link from "next/link";
import { BarChart3 } from "lucide-react";
import { isCoachDashboardPreferred } from "@/lib/coach-view-mode";

export function TeamCoachModeBanner() {
  if (!isCoachDashboardPreferred()) {
    return null;
  }

  return (
    <div className="team-coach-mode-banner">
      <Link href="/coach" className="team-coach-mode-banner__link">
        <BarChart3 className="h-4 w-4" aria-hidden />
        العودة إلى لوحة المدرب
      </Link>
    </div>
  );
}
