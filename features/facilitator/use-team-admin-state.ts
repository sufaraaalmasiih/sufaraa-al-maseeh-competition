"use client";

import { onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";
import { teamStateRef } from "@/firebase/firestore";
import {
  parseTeamFacilitatorOverride,
  parseTeamStageLocks,
  type TeamFacilitatorOverride,
  type TeamStageLocks,
} from "@/features/facilitator/team-control-types";
import { readTeamStageLocks } from "@/features/facilitator/facilitator-team-admin";

interface TeamAdminState {
  stageLocks: TeamStageLocks;
  override: TeamFacilitatorOverride | null;
  loading: boolean;
  error: string | null;
}

const EMPTY_LOCKS = parseTeamStageLocks(null);

export function useTeamAdminState(teamId: string | null): TeamAdminState {
  const [stageLocks, setStageLocks] = useState<TeamStageLocks>(EMPTY_LOCKS);
  const [override, setOverride] = useState<TeamFacilitatorOverride | null>(null);
  const [loading, setLoading] = useState(Boolean(teamId));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!teamId) {
      setStageLocks(EMPTY_LOCKS);
      setOverride(null);
      setLoading(false);
      setError(null);
      return undefined;
    }

    setLoading(true);
    return onSnapshot(
      teamStateRef("main", teamId),
      (snapshot) => {
        const data = snapshot.data();
        setStageLocks(readTeamStageLocks(data?.stageLocks));
        setOverride(parseTeamFacilitatorOverride(data?.facilitatorOverride));
        setError(null);
        setLoading(false);
      },
      () => {
        setError("تعذر تحميل إعدادات الفريق.");
        setLoading(false);
      },
    );
  }, [teamId]);

  return { stageLocks, override, loading, error };
}
