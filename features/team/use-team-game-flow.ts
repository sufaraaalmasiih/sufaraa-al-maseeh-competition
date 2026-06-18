"use client";

import { onAuthStateChanged } from "firebase/auth";
import { onSnapshot } from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import { firebaseAuth } from "@/firebase/firebaseClient";
import { teamStateRef } from "@/firebase/firestore";
import { useGameFlow } from "@/features/gameflow/use-game-flow";
import {
  getStageKeyFromGameFlowStatus,
  isTeamStageLocked,
  parseTeamFacilitatorOverride,
  parseTeamStageLocks,
  type TeamFacilitatorOverride,
  type TeamStageLocks,
} from "@/features/facilitator/team-control-types";
import { parseStage3QuestionMetadata } from "@/features/stage3/stage3-question-metadata";
import { parseStage4QuestionMetadata } from "@/features/stage4/stage4-question-metadata";
import type { AdminStageKey } from "@/features/facilitator/facilitator-team-admin";

export function useTeamGameFlow() {
  const global = useGameFlow();
  const [teamId, setTeamId] = useState<string | null>(null);
  const [stageLocks, setStageLocks] = useState<TeamStageLocks>(parseTeamStageLocks(null));
  const [override, setOverride] = useState<TeamFacilitatorOverride | null>(null);

  useEffect(() => {
    return onAuthStateChanged(firebaseAuth, (user) => {
      setTeamId(user?.uid ?? null);
    });
  }, []);

  useEffect(() => {
    if (!teamId) {
      setStageLocks(parseTeamStageLocks(null));
      setOverride(null);
      return undefined;
    }

    return onSnapshot(teamStateRef("main", teamId), (snapshot) => {
      const data = snapshot.data();
      setStageLocks(parseTeamStageLocks(data?.stageLocks));
      setOverride(parseTeamFacilitatorOverride(data?.facilitatorOverride));
    });
  }, [teamId]);

  return useMemo(() => {
    const effectiveStatus = override?.active ? override.status : global.status;
    const lockedStageKey =
      effectiveStatus && isTeamStageLocked(stageLocks, effectiveStatus)
        ? getStageKeyFromGameFlowStatus(effectiveStatus)
        : null;

    return {
      ...global,
      status: effectiveStatus,
      currentStage: override?.active ? override.currentStage : global.currentStage,
      stage3OwnerTeamId:
        override?.active && override.stage3OwnerTeamId
          ? override.stage3OwnerTeamId
          : global.stage3OwnerTeamId,
      stage3OwnerTeamName:
        override?.active && override.stage3OwnerTeamName
          ? override.stage3OwnerTeamName
          : global.stage3OwnerTeamName,
      stage3ActiveQuestion: override?.active
        ? parseStage3QuestionMetadata(override.stage3ActiveQuestion) ?? global.stage3ActiveQuestion
        : global.stage3ActiveQuestion,
      stage4ActiveQuestion: override?.active
        ? parseStage4QuestionMetadata(override.stage4ActiveQuestion) ?? global.stage4ActiveQuestion
        : global.stage4ActiveQuestion,
      stage4QuestionIndex:
        override?.active && typeof override.stage4QuestionIndex === "number"
          ? override.stage4QuestionIndex
          : global.stage4QuestionIndex,
      effectiveStatus,
      lockedStageKey,
      isFacilitatorOverride: Boolean(override?.active),
    };
  }, [global, override, stageLocks]);
}
