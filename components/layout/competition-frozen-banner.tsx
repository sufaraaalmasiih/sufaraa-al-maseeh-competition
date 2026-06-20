"use client";

import { Snowflake } from "lucide-react";

interface CompetitionFrozenBannerProps {
  frozen: boolean;
}

export function CompetitionFrozenBanner({ frozen }: CompetitionFrozenBannerProps) {
  if (!frozen) {
    return null;
  }

  return (
    <div className="competition-frozen-overlay" role="status" aria-live="polite">
      <div className="competition-frozen-overlay__card">
        <Snowflake className="competition-frozen-overlay__icon" aria-hidden />
        <p className="competition-frozen-overlay__title">المسابقة متوقّفة مؤقتاً</p>
        <p className="competition-frozen-overlay__subtitle">
          المؤقّت متجمّد — انتظر إشعار الميسّر
        </p>
      </div>
    </div>
  );
}
