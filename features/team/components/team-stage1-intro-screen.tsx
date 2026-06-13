"use client";

import { useState } from "react";
import { ErrorState, LoadingState } from "@/components/layout/state-view";
import { GameReadyButton } from "@/components/ui/game-ready-button";
import { confirmStage1IntroReady } from "@/features/stage1/confirm-stage1-intro-ready";
import { Stage1IntroContent } from "@/features/stage1/components/stage1-intro-content";
import { STAGE1_INTRO_COPY } from "@/features/stage1/stage1-intro-copy";
import { useTeamCompetitionContext } from "@/features/team/use-team-competition-context";

export function TeamStage1IntroScreen() {
  const { teamName, stage1IntroReady, loading, error } = useTeamCompetitionContext();
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  async function handleReady() {
    if (stage1IntroReady || saving) {
      return;
    }

    setSaving(true);
    setSaveError(null);

    try {
      await confirmStage1IntroReady();
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
    <Stage1IntroContent
      teamName={teamName}
      footer={
        <>
          {saveError ? (
            <ErrorState title="تعذر التسجيل" description={saveError} />
          ) : null}

          <div className="stage1-intro-screen__action">
            <GameReadyButton
              disabled={stage1IntroReady || saving}
              onClick={handleReady}
            >
              {saving ? "جاري التسجيل..." : stage1IntroReady ? "تم التسجيل" : "جاهز"}
            </GameReadyButton>
          </div>

          {stage1IntroReady ? (
            <p className="stage1-intro-screen__hint">{STAGE1_INTRO_COPY.hint}</p>
          ) : null}
        </>
      }
    />
  );
}
