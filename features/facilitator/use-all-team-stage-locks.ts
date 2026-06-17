"use client";

import { useMemo } from "react";
import { readTeamStageLocks } from "@/features/facilitator/facilitator-team-admin";
import type { TeamStageLocks } from "@/features/facilitator/team-control-types";
import { parseTeamStageLocks } from "@/features/facilitator/team-control-types";
import { useTeamStatesSnapshot } from "@/features/gameflow/team-states-store";

interface AllTeamStageLocksSummary {
  locks: TeamStageLocks;
  mixed: boolean;
  loading: boolean;
}

export function useAllTeamStageLocksSummary(): AllTeamStageLocksSummary {
  const { docs, loading } = useTeamStatesSnapshot("main");

  return useMemo(() => {
    const rows = docs.map((docSnap) => readTeamStageLocks(docSnap.data.stageLocks));

    if (rows.length === 0) {
      return { locks: parseTeamStageLocks(null), mixed: false, loading };
    }

    const first = rows[0];
    const mixed = rows.some(
      (locks) =>
        locks.stage1 !== first.stage1 ||
        locks.stage2 !== first.stage2 ||
        locks.stage3 !== first.stage3 ||
        locks.stage4 !== first.stage4,
    );

    return { locks: first, mixed, loading };
  }, [docs, loading]);
}
