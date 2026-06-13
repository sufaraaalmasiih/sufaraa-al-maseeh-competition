"use client";

import { useTeamCompetitionContext } from "@/features/team/use-team-competition-context";

export function FloatingHud() {
  const { teamName, totalScore, loading } = useTeamCompetitionContext();

  return (
    <div className="floating-hud" aria-label="معلومات الفريق">
      <span className="floating-hud-score">
        <span aria-hidden>⭐ </span>
        {loading ? "—" : totalScore} نقطة
      </span>
      <span className="floating-hud-team">{loading ? "..." : teamName}</span>
    </div>
  );
}
