"use client";

import { BrandLogoMark } from "@/components/competition/brand-logo-mark";
import { GameplayHeaderMeta } from "@/components/competition/gameplay-header-meta";
import { GameplayHeaderTimer } from "@/components/competition/gameplay-header-timer";
import { cn } from "@/lib/utils";

interface AuditGameplayHeaderProps {
  stageLabel: string;
  hasTimer?: boolean;
  remainingSeconds?: number;
}

export function AuditGameplayHeader({
  stageLabel,
  hasTimer = false,
  remainingSeconds = 312,
}: AuditGameplayHeaderProps) {
  return (
    <header
      className={cn(
        "gameplay-unified-header",
        hasTimer && "gameplay-unified-header--has-timer",
      )}
    >
      <div className="gameplay-unified-header__side gameplay-unified-header__side--start">
        <div className="gameplay-header-identity">
          <BrandLogoMark className="gameplay-unified-competition-logo" size="lg" />
          <div className="gameplay-unified-brand">
            <p className="gameplay-unified-title">سفراء المسيح</p>
            <p className="gameplay-unified-slogan">نحيا بالكلمة... ونشهد للحق</p>
          </div>
        </div>
      </div>

      <div className="gameplay-unified-header__center">
        {hasTimer ? (
          <GameplayHeaderTimer
            label="الوقت المتبقي"
            remainingSeconds={remainingSeconds}
            durationSeconds={420}
            isExpired={false}
            paused={false}
          />
        ) : (
          <p className="gameplay-unified-stage gameplay-unified-stage--center">{stageLabel}</p>
        )}
      </div>

      <div className="gameplay-unified-header__side gameplay-unified-header__side--end">
        <GameplayHeaderMeta teamName="فريق النور" totalScore={125} />
      </div>
    </header>
  );
}
