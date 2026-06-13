"use client";

import { onAuthStateChanged } from "firebase/auth";
import { onSnapshot } from "firebase/firestore";
import { useEffect, useRef, useState } from "react";
import { firebaseAuth } from "@/firebase/firebaseClient";
import { teamRef, teamStateRef } from "@/firebase/firestore";
import {
  emptyStage2Roles,
  type Stage2Roles,
} from "@/features/stage2/stage2-types";
import { teamDebug } from "@/lib/team-debug";
import type { TeamPlayer } from "@/types";

interface TeamStage2Data {
  teamId: string | null;
  players: TeamPlayer[];
  roles: Stage2Roles;
  loading: boolean;
  error: string | null;
}

export function useTeamStage2Data(): TeamStage2Data {
  const [teamId, setTeamId] = useState<string | null>(null);
  const [players, setPlayers] = useState<TeamPlayer[]>([]);
  const [roles, setRoles] = useState<Stage2Roles>(emptyStage2Roles);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const subscribedTeamIdRef = useRef<string | null>(null);

  useEffect(() => {
    teamDebug("useTeamStage2Data: hook mounted, subscribing auth");
    let unsubscribeTeam: (() => void) | undefined;
    let unsubscribeTeamState: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(firebaseAuth, (user) => {
      unsubscribeTeam?.();
      unsubscribeTeamState?.();
      unsubscribeTeam = undefined;
      unsubscribeTeamState = undefined;

      if (!user) {
        subscribedTeamIdRef.current = null;
        teamDebug("useTeamStage2Data: no user", { loading: false });
        setTeamId(null);
        setPlayers([]);
        setRoles(emptyStage2Roles);
        setError(null);
        setLoading(false);
        return;
      }

      const nextTeamId = user.uid;
      const isNewTeam = subscribedTeamIdRef.current !== nextTeamId;
      subscribedTeamIdRef.current = nextTeamId;
      setTeamId(nextTeamId);

      if (isNewTeam) {
        setLoading(true);
        teamDebug("useTeamStage2Data: new team subscription, loading true", {
          teamId: nextTeamId,
        });
      } else {
        teamDebug("useTeamStage2Data: auth refresh, keep loading state", {
          teamId: nextTeamId,
        });
      }

      unsubscribeTeam = onSnapshot(
        teamRef(nextTeamId),
        (snapshot) => {
          const data = snapshot.data();
          teamDebug("useTeamStage2Data: team doc snapshot", {
            path: `teams/${nextTeamId}`,
            exists: snapshot.exists(),
            playersCount: Array.isArray(data?.players) ? data.players.length : 0,
            loading: false,
          });
          setPlayers(Array.isArray(data?.players) ? data.players : []);
          setError(null);
          setLoading(false);
        },
        () => {
          setError("تعذر تحميل بيانات الفريق.");
          setLoading(false);
          teamDebug("useTeamStage2Data: team doc error, loading false");
        },
      );
      unsubscribeTeamState = onSnapshot(
        teamStateRef("main", nextTeamId),
        (snapshot) => {
          const data = snapshot.data();
          teamDebug("useTeamStage2Data: teamState snapshot", {
            path: `competitions/main/teamStates/${nextTeamId}`,
            exists: snapshot.exists(),
            rolesLocked: data?.stage2Roles?.locked === true,
          });
          setRoles({
            ...emptyStage2Roles,
            ...(data?.stage2Roles ?? {}),
          });
        },
        () => {
          setError("تعذر تحميل توزيع المجالات.");
          setLoading(false);
          teamDebug("useTeamStage2Data: teamState error, loading false");
        },
      );
    });

    return () => {
      unsubscribeTeam?.();
      unsubscribeTeamState?.();
      unsubscribeAuth();
      subscribedTeamIdRef.current = null;
    };
  }, []);

  return { teamId, players, roles, loading, error };
}
