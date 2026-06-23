"use client";

import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import {
  isObjectionAcceptedNoticeActive,
  type ObjectionAcceptedNotice,
} from "@/features/competition/objection-accepted-notice";
import { getSyncedNowMs } from "@/lib/server-clock-sync";

interface ObjectionAcceptedBannerProps {
  notice: ObjectionAcceptedNotice | null;
}

export function ObjectionAcceptedBanner({ notice }: ObjectionAcceptedBannerProps) {
  const [now, setNow] = useState(() => getSyncedNowMs());

  useEffect(() => {
    if (!notice) {
      return;
    }

    const interval = window.setInterval(() => {
      setNow(getSyncedNowMs());
    }, 250);

    return () => window.clearInterval(interval);
  }, [notice]);

  if (!isObjectionAcceptedNoticeActive(notice, now) || !notice) {
    return null;
  }

  return (
    <div className="objection-accepted-banner" role="status" aria-live="polite">
      <CheckCircle2 className="objection-accepted-banner__icon" aria-hidden />
      <div className="objection-accepted-banner__content">
        <p className="objection-accepted-banner__title">{notice.message}</p>
        {notice.scope === "team" && notice.teamName ? (
          <p className="objection-accepted-banner__subtitle">الفريق: {notice.teamName}</p>
        ) : notice.scope === "general" ? (
          <p className="objection-accepted-banner__subtitle">إعلان عام لجميع الفرق والجمهور</p>
        ) : null}
      </div>
    </div>
  );
}
