"use client";

import type { ReactNode } from "react";
import { BrandLogoMark } from "@/components/competition/brand-logo-mark";
import { cn } from "@/lib/utils";

interface CompetitionBrandHeaderCardProps {
  centerLabel?: string;
  endSlot?: ReactNode;
  className?: string;
}

export function CompetitionBrandHeaderCard({
  centerLabel,
  endSlot,
  className,
}: CompetitionBrandHeaderCardProps) {
  return (
    <header className={cn("gameplay-unified-header", className)}>
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
        {centerLabel ? (
          <p className="gameplay-unified-stage gameplay-unified-stage--center">{centerLabel}</p>
        ) : null}
      </div>

      <div className="gameplay-unified-header__side gameplay-unified-header__side--end">
        {endSlot ?? <span className="stage1-intro-screen__team-slot" aria-hidden />}
      </div>
    </header>
  );
}
