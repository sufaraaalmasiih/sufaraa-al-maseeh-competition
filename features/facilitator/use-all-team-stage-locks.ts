"use client";

import { onSnapshot } from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import { teamStatesCollectionRef } from "@/firebase/firestore";
import { readTeamStageLocks } from "@/features/facilitator/facilitator-team-admin";
import type { TeamStageLocks } from "@/features/facilitator/team-control-types";
import { parseTeamStageLocks } from "@/features/facilitator/team-control-types";

interface AllTeamStageLocksSummary {
  locks: TeamStageLocks;
  mixed: boolean;
  loading: boolean;
}

export function useAllTeamStageLocksSummary(): AllTeamStageLocksSummary {
  const [rows, setRows] = useState<TeamStageLocks[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onSnapshot(
      teamStatesCollectionRef("main"),
      (snapshot) => {
        setRows(snapshot.docs.map((docSnap) => readTeamStageLocks(docSnap.data()?.stageLocks)));
        setLoading(false);
      },
      () => {
        setRows([]);
        setLoading(false);
      },
    );
  }, []);

  return useMemo(() => {
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
  }, [loading, rows]);
}
