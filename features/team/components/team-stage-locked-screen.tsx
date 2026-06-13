"use client";

import { STAGE_OPTIONS_LABELS } from "@/features/facilitator/facilitator-controls-copy";
import type { AdminStageKey } from "@/features/facilitator/facilitator-team-admin";

interface TeamStageLockedScreenProps {
  stageKey: AdminStageKey;
}

export function TeamStageLockedScreen({ stageKey }: TeamStageLockedScreenProps) {
  return (
    <section className="competition-stage-screen">
      <div className="competition-stage-screen__card glass-card-white">
        <span className="competition-stage-screen__badge competition-stage-screen__badge--amber">
          مقفلة
        </span>
        <h2 className="competition-stage-screen__title">المرحلة مغلقة</h2>
        <p className="competition-stage-screen__subtitle">
          أغلق الميسر مرحلة «{STAGE_OPTIONS_LABELS[stageKey]}» لهذا الفريق. انتظر حتى يُعاد
          فتحها.
        </p>
      </div>
    </section>
  );
}
