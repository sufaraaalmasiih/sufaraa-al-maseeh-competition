"use client";

import competitionLogo from "@/features/team/assets/competition-logo-white-transparent.png";
import { useCompetitionContent } from "@/features/competition-content/competition-content-runtime";
import { cn } from "@/lib/utils";

interface CompetitionBrandHeroProps {
  subtitle?: string;
  className?: string;
  compact?: boolean;
}

export function CompetitionBrandHero({
  subtitle,
  className,
  compact = false,
}: CompetitionBrandHeroProps) {
  const content = useCompetitionContent();

  return (
    <div className={cn("team-waiting-screen", compact && "team-waiting-screen--compact", className)}>
      <div className="team-waiting-screen__logo-wrap">
        <img
          src={competitionLogo.src}
          alt={`شعار ${content.brand.title}`}
          width={competitionLogo.width}
          height={competitionLogo.height}
          decoding="async"
          fetchPriority="high"
          className="team-waiting-screen__logo"
        />
      </div>

      <h1 className="team-waiting-screen__title">{content.brand.title}</h1>
      <p className="team-waiting-screen__slogan">{content.brand.slogan}</p>

      {subtitle ? <p className="team-waiting-screen__team-name">{subtitle}</p> : null}
    </div>
  );
}
