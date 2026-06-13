import { BrandLogoMark } from "@/components/competition/brand-logo-mark";
import { COMPETITION_INTRO_SUMMARY } from "@/features/gameflow/competition-intro-copy";
import { cn } from "@/lib/utils";

interface AppHeaderProps {
  /** اسم اللوحة أو الشاشة الحالية (مثل: لوحة الميسر). */
  title: string;
  variant?: "brand" | "gradient";
}

export function AppHeader({ title, variant = "brand" }: AppHeaderProps) {
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
          <h1 className="app-brand-header__name">{COMPETITION_INTRO_SUMMARY.title}</h1>
          <p className="app-brand-header__slogan">{COMPETITION_INTRO_SUMMARY.slogan}</p>
        </div>
      </div>

      <div className="app-brand-header__context">
        <span className="app-brand-header__badge">{title}</span>
      </div>
    </header>
  );
}
