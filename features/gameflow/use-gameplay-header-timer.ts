"use client";

import { useCompetitionTimer } from "@/features/gameflow/use-competition-timer";
import { useGameFlow } from "@/features/gameflow/use-game-flow";
import { useTeamCompetitionContext } from "@/features/team/use-team-competition-context";
import type { GameFlowStatus } from "@/types";

export interface GameplayHeaderTimerState {
  label: string;
  remainingSeconds: number;
  durationSeconds: number;
  isExpired: boolean;
  paused: boolean;
}

export function useGameplayHeaderTimer(
  status: GameFlowStatus | null,
): GameplayHeaderTimerState | null {
  const { timer, remainingSeconds, isExpired } = useCompetitionTimer();
  const { stage3OwnerTeamId } = useGameFlow();
  const { teamId } = useTeamCompetitionContext();

  if (!status || !timer?.active) {
    return null;
  }

  const paused = timer.paused === true;
  const base = {
    remainingSeconds,
    durationSeconds: timer.durationSeconds,
    isExpired,
    paused,
  };

  if (status === "stage1_running" && timer.stage === "stage1") {
    return {
      label: "وقت المرحلة الأولى",
      ...base,
    };
  }

  if (status === "stage2_reading" && timer.stage === "stage2" && timer.purpose === "reading") {
    return {
      label: "وقت القراءة",
      ...base,
    };
  }

  if (
    status === "stage2_player_turns" &&
    timer.stage === "stage2" &&
    timer.purpose === "answering"
  ) {
    return {
      label: "وقت الإجابة",
      ...base,
    };
  }

  if (
    status === "stage3_board" &&
    timer.stage === "stage3" &&
    timer.purpose === "selection"
  ) {
    const isOwner = Boolean(teamId && stage3OwnerTeamId && teamId === stage3OwnerTeamId);

    return {
      label: isOwner ? "وقت اختيار السؤال" : "وقت اختيار صاحب الدور",
      ...base,
    };
  }

  if (
    status === "stage3_question_open" &&
    timer.stage === "stage3" &&
    timer.purpose === "answering"
  ) {
    return {
      label: "وقت الإجابة",
      ...base,
    };
  }

  if (
    status === "stage4_question_open" &&
    timer.stage === "stage4" &&
    timer.purpose === "answering"
  ) {
    return {
      label: "وقت الإجابة",
      ...base,
    };
  }

  return null;
}
