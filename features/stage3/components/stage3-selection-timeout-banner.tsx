"use client";

import { useEffect, useState } from "react";
import {
  isStage3SelectionTimeoutNoticeActive,
  type Stage3SelectionTimeoutNotice,
} from "@/features/stage3/stage3-selection-timeout-notice";

interface Stage3SelectionTimeoutBannerProps {
  notice: Stage3SelectionTimeoutNotice | null;
}

export function Stage3SelectionTimeoutBanner({
  notice,
}: Stage3SelectionTimeoutBannerProps) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!notice) {
      return;
    }

    const interval = window.setInterval(() => {
      setNow(Date.now());
    }, 250);

    return () => window.clearInterval(interval);
  }, [notice]);

  if (!isStage3SelectionTimeoutNoticeActive(notice, now) || !notice) {
    return null;
  }

  return (
    <div
      className="glass-card-premium mb-4 border border-[#143A5A]/20 bg-[#FFF8E8]/90 px-5 py-4 text-center"
      role="status"
      aria-live="polite"
    >
      <p className="text-base font-black text-[#143A5A]">
        لم يختر فريق <span className="text-[#2388C4]">{notice.ownerTeamName}</span> سؤالاً
        في الوقت المحدد
      </p>
      <p className="mt-2 text-sm font-bold text-[#B45309]">تم خصم 5 نقاط</p>
      <p className="mt-1 text-sm font-semibold text-[#143A5A]/80">
        ينتقل الدور إلى الفريق التالي
      </p>
    </div>
  );
}
