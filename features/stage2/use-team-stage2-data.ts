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

const STAGE2_DATA_TIMEOUT_MS = 10_000;

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
  const teamDocReadyRef = useRef(false);
  const teamStateReadyRef = useRef(false);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    teamDebug("useTeamStage2Data: hook mounted, subscribing auth");
    let unsubscribeTeam: (() => void) | undefined;
    let unsubscribeTeamState: (() => void) | undefined;

    const clearDataTimeout = () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };

    const finishLoading = (nextError: string | null = null) => {
      clearDataTimeout();
      setLoading(false);
      if (nextError) {
        setError(nextError);
      }
      teamDebug("useTeamStage2Data: loading false reached", { error: nextError });
    };

    const maybeFinishLoading = () => {
      if (teamDocReadyRef.current || teamStateReadyRef.current) {
        finishLoading();
      }
    };

    const scheduleDataTimeout = () => {
      clearDataTimeout();
      timeoutRef.current = window.setTimeout(() => {
        teamDebug("useTeamStage2Data: data timeout — forcing loading false");
        finishLoading("تعذر تحميل بيانات الفريق خلال المهلة. أعد تحميل الصفحة.");
      }, STAGE2_DATA_TIMEOUT_MS);
    };

    const unsubscribeAuth = onAuthStateChanged(firebaseAuth, (user) => {
      unsubscribeTeam?.();
      unsubscribeTeamState?.();
      unsubscribeTeam = undefined;
      unsubscribeTeamState = undefined;
      clearDataTimeout();
      teamDocReadyRef.current = false;
      teamStateReadyRef.current = false;

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
      subscribedTeamIdRef.current = nextTeamId;
      setTeamId(nextTeamId);
      setLoading(true);
      setError(null);
      scheduleDataTimeout();
      teamDebug("useTeamStage2Data: subscribing team listeners", { teamId: nextTeamId });

      unsubscribeTeam = onSnapshot(
        teamRef(nextTeamId),
        (snapshot) => {
          const data = snapshot.data();
          teamDocReadyRef.current = true;
          teamDebug("useTeamStage2Data: team doc snapshot", {
            path: `teams/${nextTeamId}`,
            exists: snapshot.exists(),
            playersCount: Array.isArray(data?.players) ? data.players.length : 0,
          });
          setPlayers(Array.isArray(data?.players) ? data.players : []);
          setError(null);
          maybeFinishLoading();
        },
        () => {
          teamDocReadyRef.current = true;
          setError("تعذر تحميل بيانات الفريق.");
          finishLoading("تعذر تحميل بيانات الفريق.");
          teamDebug("useTeamStage2Data: team doc error");
        },
      );

      unsubscribeTeamState = onSnapshot(
        teamStateRef("main", nextTeamId),
        (snapshot) => {
          const data = snapshot.data();
          teamStateReadyRef.current = true;
          teamDebug("useTeamStage2Data: teamState snapshot", {
            path: `competitions/main/teamStates/${nextTeamId}`,
            exists: snapshot.exists(),
            rolesLocked: data?.stage2Roles?.locked === true,
          });
          setRoles({
            ...emptyStage2Roles,
            ...(data?.stage2Roles ?? {}),
          });
          setError(null);
          maybeFinishLoading();
        },
        () => {
          teamStateReadyRef.current = true;
          setError("تعذر تحميل توزيع المجالات.");
          finishLoading("تعذر تحميل توزيع المجالات.");
          teamDebug("useTeamStage2Data: teamState error");
        },
      );
    });

    return () => {
      unsubscribeTeam?.();
      unsubscribeTeamState?.();
      unsubscribeAuth();
      clearDataTimeout();
      subscribedTeamIdRef.current = null;
      teamDocReadyRef.current = false;
      teamStateReadyRef.current = false;
    };
  }, []);

  return { teamId, players, roles, loading, error };
}
