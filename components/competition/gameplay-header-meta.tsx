"use client";

import { TeamLogoBadge } from "@/components/competition/team-logo-badge";
import { cn } from "@/lib/utils";

interface GameplayHeaderMetaProps {
  teamName: string;
  logoUrl?: string | null;
  stageLabel?: string;
  totalScore: number;
  loading?: boolean;
  className?: string;
}

export function GameplayHeaderMeta({
  teamName,
  logoUrl,
  stageLabel,
  totalScore,
  loading = false,
  className,
}: GameplayHeaderMetaProps) {
  return (
    <div className={cn("gameplay-header-meta", className)}>
      <TeamLogoBadge
        className="gameplay-unified-team-logo"
        logoUrl={logoUrl}
        teamName={loading ? "فريق" : teamName}
        variant="header"
      />
      <p className="gameplay-unified-team-name">{loading ? "..." : teamName}</p>
      {stageLabel ? <p className="gameplay-unified-stage">{stageLabel}</p> : null}
      <p className="gameplay-unified-score">
        <span aria-hidden>⭐ </span>
        {loading ? "—" : totalScore} نقطة
      </p>
    </div>
  );
}
