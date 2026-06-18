"use client";

import type { CSSProperties } from "react";
import { useMemo, useState } from "react";
import { ErrorState, LoadingState } from "@/components/layout/state-view";
import { useCompetitionTimer } from "@/features/gameflow/use-competition-timer";
import { useGameFlow } from "@/features/gameflow/use-game-flow";
import { useStage1Ranking } from "@/features/stage1/use-stage1-ranking";
import { isTeamReadyForReadiness } from "@/features/facilitator/facilitator-readiness";
import {
  finishStage,
  setGameFlowStatus,
} from "@/features/facilitator/facilitator-flow-actions";
import {
  FLOW_COCKPIT_ACCENTS,
  getFacilitatorPhasePlan,
  type FacilitatorPhasePlan,
} from "@/features/facilitator/facilitator-flow-plan";
import {
  hasFacilitatorStageWorkspace,
  shouldShowPhaseCanvas,
} from "@/features/facilitator/facilitator-stage-workspace";
import { FacilitatorCommandDeck } from "@/features/facilitator/components/facilitator-command-deck";
import { FacilitatorCompetitionFreeze } from "@/features/facilitator/components/facilitator-competition-freeze";
import { FacilitatorPhaseCanvas } from "@/features/facilitator/components/facilitator-phase-canvas";
import { FacilitatorScoreboard } from "@/features/facilitator/components/facilitator-scoreboard";
import { FacilitatorSessionStartDialog } from "@/features/facilitator/components/facilitator-session-start-dialog";
import { FacilitatorStagePanel } from "@/features/facilitator/components/facilitator-stage-panel";
import { FacilitatorStageRail } from "@/features/facilitator/components/facilitator-stage-rail";
import { useLiveResults } from "@/features/facilitator/use-live-results";
import { cn } from "@/lib/utils";

export function FacilitatorFlowPanel() {
  const [sessionDialogOpen, setSessionDialogOpen] = useState(false);
  const {
    status,
    stage3OwnerTeamId,
    stage4QuestionIndex,
    stage4QuestionCount,
    competitionFrozen,
    loading,
    error,
  } = useGameFlow();
  const { timer, remainingSeconds, isExpired } = useCompetitionTimer();
  const { teams, loading: teamsLoading, error: teamsError } = useStage1Ranking();

  const liveContext = useMemo(
    () => ({
      stage4QuestionIndex,
      stage4QuestionCount,
      stage3OwnerTeamId,
    }),
    [stage4QuestionIndex, stage4QuestionCount, stage3OwnerTeamId],
  );

  const {
    teams: liveTeams,
    stageName: liveStageName,
    loading: liveLoading,
    error: liveError,
  } = useLiveResults(status, liveContext);

  const plan = getFacilitatorPhasePlan(status);
  const cockpitTheme = FLOW_COCKPIT_ACCENTS[plan.stageKey];
  const cockpitStyle = useMemo(
    () =>
      ({
        "--flow-accent": cockpitTheme.accent,
        "--flow-accent-soft": cockpitTheme.accentSoft,
        borderColor: cockpitTheme.border,
      }) as CSSProperties,
    [cockpitTheme],
  );
  const isPreStart = status === "waiting_players";
  const showTimerControls =
    plan.stageKey === "stage1" ||
    plan.stageKey === "stage2" ||
    plan.stageKey === "stage3" ||
    plan.stageKey === "stage4";
  const showCanvas = status ? shouldShowPhaseCanvas(status) : false;
  const stackScoreboard = status ? hasFacilitatorStageWorkspace(status) : false;

  const readyCount = useMemo(() => {
    if (!plan.readinessKey) {
      return null;
    }

    return teams.filter((team) => isTeamReadyForReadiness(team, plan.readinessKey)).length;
  }, [plan.readinessKey, teams]);

  const notReadyTeamNames = useMemo(() => {
    if (!plan.readinessKey) {
      return [];
    }

    return teams
      .filter((team) => !isTeamReadyForReadiness(team, plan.readinessKey))
      .map((team) => team.teamName);
  }, [plan.readinessKey, teams]);

  async function runAdvance(activePlan: FacilitatorPhasePlan) {
    const hero = activePlan.hero;
    if (!hero) {
      return;
    }
    if (hero.kind === "finish") {
      const stageNumber =
        activePlan.stageKey === "stage1"
          ? 1
          : activePlan.stageKey === "stage2"
            ? 2
            : activePlan.stageKey === "stage3"
              ? 3
              : activePlan.stageKey === "stage4"
                ? 4
                : null;
      if (stageNumber) {
        await finishStage(stageNumber);
      }
      return;
    }
    await setGameFlowStatus(hero.nextStatus, hero.nextStage);
  }

  async function handleAdvance(activePlan: FacilitatorPhasePlan) {
    const hero = activePlan.hero;
    if (!hero) {
      return;
    }

    if (
      status === "waiting_players" &&
      hero.nextStatus === "competition_intro"
    ) {
      setSessionDialogOpen(true);
      return;
    }

    await runAdvance(activePlan);
  }

  if (loading) {
    return <LoadingState variant="page" waitingComponent="FacilitatorFlowPanel:useGameFlow" />;
  }

  if (error) {
    return <ErrorState title="تعذر تحميل سير المسابقة" description={error} />;
  }

  return (
    <>
      <FacilitatorSessionStartDialog
        open={sessionDialogOpen}
        onClose={() => setSessionDialogOpen(false)}
        onStarted={async () => {
          await runAdvance(plan);
        }}
      />

      <div className="flow-cockpit" style={cockpitStyle}>
      <FacilitatorStageRail status={status ?? "waiting_players"} />

      <FacilitatorCommandDeck
        plan={plan}
        status={status}
        timer={timer}
        timerActive={Boolean(timer?.active)}
        remainingSeconds={remainingSeconds}
        isExpired={isExpired}
        showTimerControls={showTimerControls}
        readyCount={readyCount}
        totalTeams={teams.length}
        notReadyTeamNames={notReadyTeamNames}
        onAdvance={handleAdvance}
      />

      <FacilitatorCompetitionFreeze frozen={competitionFrozen} />

      <div className={cn("flow-cockpit__grid", stackScoreboard && "flow-cockpit__grid--stacked")}>
        <section className="flow-cockpit__main">
          {showCanvas && status ? (
            <FacilitatorPhaseCanvas plan={plan} status={status} />
          ) : null}

          <div className="flow-cockpit__workspace">
            <FacilitatorStagePanel />
          </div>
        </section>

        <FacilitatorScoreboard
          className={cn(stackScoreboard && "flow-scoreboard--stacked")}
          mode={isPreStart ? "teams" : "live"}
          stageName={liveStageName}
          teams={teams}
          liveTeams={liveTeams}
          loading={isPreStart ? teamsLoading : liveLoading}
          error={isPreStart ? teamsError : liveError}
          readinessKey={plan.readinessKey}
          ownerTeamId={stage3OwnerTeamId}
        />
      </div>
    </div>
    </>
  );
}
