"use client";

import { useState } from "react";
import { ErrorState, LoadingState } from "@/components/layout/state-view";
import { GameReadyButton } from "@/components/ui/game-ready-button";
import { StageIntroContent } from "@/features/stage/components/stage-intro-content";
import { useCompetitionContent } from "@/features/competition-content/competition-content-runtime";
import {
  confirmStageIntroReady,
  type TeamStageIntroKey,
} from "@/features/team/confirm-stage-intro-ready";
import { useTeamCompetitionContext } from "@/features/team/use-team-competition-context";

interface TeamStageIntroScreenProps {
  stage: TeamStageIntroKey;
  showWaitStatus?: boolean;
}

function isStageIntroReady(
  stage: TeamStageIntroKey,
  context: ReturnType<typeof useTeamCompetitionContext>,
): boolean {
  switch (stage) {
    case "stage1":
      return context.stage1IntroReady;
    case "stage2":
      return context.stage2IntroReady;
    case "stage3":
      return context.stage3IntroReady;
    case "stage4":
      return context.stage4IntroReady;
    default:
      return false;
  }
}

export function TeamStageIntroScreen({ stage, showWaitStatus = false }: TeamStageIntroScreenProps) {
  const content = useCompetitionContent();
  const teamContext = useTeamCompetitionContext();
  const { loading, error } = teamContext;
  const introReady = isStageIntroReady(stage, teamContext);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const stageContent = content.stages[stage];

  async function handleReady() {
    if (introReady || saving) {
      return;
    }

    setSaving(true);
    setSaveError(null);

    try {
      await confirmStageIntroReady(stage);
    } catch {
      setSaveError("تعذر تسجيل الجاهزية. حاول مرة أخرى.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <LoadingState variant="page" />;
  }

  if (error) {
    return <ErrorState title="تعذر تحميل بيانات الفريق" description={error} />;
  }

  return (
    <StageIntroContent
      stage={stage}
      showTeamMeta
      showWaitStatus={showWaitStatus}
      footer={
        <>
          {saveError ? (
            <ErrorState title="تعذر التسجيل" description={saveError} />
          ) : null}

          <div className="stage1-intro-screen__action">
            <GameReadyButton disabled={introReady || saving} onClick={handleReady}>
              {saving ? "جاري التسجيل..." : introReady ? "تم التسجيل" : "جاهز"}
            </GameReadyButton>
          </div>

          <p className="stage1-intro-screen__hint">{stageContent.hint}</p>
        </>
      }
    />
  );
}
