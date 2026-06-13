"use client";

import { useState } from "react";
import { ErrorState, LoadingState } from "@/components/layout/state-view";
import { GameReadyButton } from "@/components/ui/game-ready-button";
import { CompetitionIntroContent } from "@/features/gameflow/components/competition-intro-content";
import { confirmCompetitionIntroReady } from "@/features/team/confirm-competition-intro-ready";
import { useTeamCompetitionContext } from "@/features/team/use-team-competition-context";

export function TeamCompetitionIntroScreen() {
  const { competitionIntroReady, loading, error } = useTeamCompetitionContext();
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  async function handleReady() {
    if (competitionIntroReady || saving) {
      return;
    }

    setSaving(true);
    setSaveError(null);

    try {
      await confirmCompetitionIntroReady();
    } catch {
      setSaveError("تعذر تسجيل الجاهزية. حاول مرة أخرى.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState title="تعذر تحميل بيانات الفريق" description={error} />;
  }

  return (
    <div className="competition-intro-screen space-y-6">
      <CompetitionIntroContent showReadyHint />

      {saveError ? (
        <ErrorState title="تعذر التسجيل" description={saveError} />
      ) : null}

      <div className="game-ready-btn-wrap">
        <GameReadyButton
          disabled={competitionIntroReady || saving}
          onClick={handleReady}
        >
          {saving ? "جاري التسجيل..." : "تم الاطلاع"}
        </GameReadyButton>
      </div>

    </div>
  );
}
