"use client";

import { BrandLogoMark } from "@/components/competition/brand-logo-mark";
import { useCompetitionContent } from "@/features/competition-content/competition-content-runtime";
import { cn } from "@/lib/utils";

interface AppHeaderProps {
  /** اسم اللوحة أو الشاشة الحالية (مثل: لوحة الميسر). */
  title: string;
  variant?: "brand" | "gradient";
}

export function AppHeader({ title, variant = "brand" }: AppHeaderProps) {
  const content = useCompetitionContent();
  const isGradient = variant === "gradient";

  return (
    <header
      className={cn(
        "app-brand-header",
        isGradient && "app-brand-header--gradient",
      )}
    >
      <div className="app-brand-header__identity">
        <BrandLogoMark className="app-brand-header__logo" size="lg" />
        <div className="app-brand-header__copy">
          <h1 className="app-brand-header__name">{content.brand.title}</h1>
          <p className="app-brand-header__slogan">{content.brand.slogan}</p>
        </div>
      </div>

      <div className="app-brand-header__context">
        <span className="app-brand-header__badge">{title}</span>
      </div>
    </header>
  );
}
