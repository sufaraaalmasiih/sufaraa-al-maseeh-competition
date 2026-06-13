"use client";

import { onAuthStateChanged } from "firebase/auth";
import { onSnapshot } from "firebase/firestore";
import { useEffect, useRef, useState } from "react";
import { firebaseAuth } from "@/firebase/firebaseClient";
import { teamRef, teamStateRef } from "@/firebase/firestore";
import { patchLoadingDebug } from "@/lib/loading-debug-store";
import { realLoadingDebug } from "@/lib/real-loading-debug";
import type { TeamPlayer } from "@/types";

interface TeamCompetitionContext {
  teamId: string | null;
  teamName: string;
  logoUrl: string | null;
  ready: boolean;
  competitionIntroReady: boolean;
  stage1IntroReady: boolean;
  players: TeamPlayer[];
  totalScore: number;
  loading: boolean;
  error: string | null;
}

export function useTeamCompetitionContext(): TeamCompetitionContext {
  const [teamId, setTeamId] = useState<string | null>(null);
  const [teamName, setTeamName] = useState("فريق");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [competitionIntroReady, setCompetitionIntroReady] = useState(false);
  const [stage1IntroReady, setStage1IntroReady] = useState(false);
  const [players, setPlayers] = useState<TeamPlayer[]>([]);
  const [totalScore, setTotalScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const subscribedTeamIdRef = useRef<string | null>(null);

  useEffect(() => {
    let unsubscribeTeamState: (() => void) | undefined;
    let unsubscribeTeam: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(firebaseAuth, (user) => {
      if (!user) {
        unsubscribeTeamState?.();
        unsubscribeTeam?.();
        unsubscribeTeamState = undefined;
        unsubscribeTeam = undefined;
        subscribedTeamIdRef.current = null;
        setTeamId(null);
        setTeamName("فريق");
        setLogoUrl(null);
        setReady(false);
        setCompetitionIntroReady(false);
        setStage1IntroReady(false);
        setPlayers([]);
        setTotalScore(0);
        setLoading(false);
        setError(null);
        patchLoadingDebug({ teamLoading: false });
        realLoadingDebug("useTeamCompetitionContext", "loading false reached (no user)", {
          teamId: null,
        });
        return;
      }

      const nextTeamId = user.uid;
      realLoadingDebug("useTeamCompetitionContext", "teamId received", {
        teamId: nextTeamId,
      });

      if (subscribedTeamIdRef.current === nextTeamId && unsubscribeTeamState) {
        realLoadingDebug("useTeamCompetitionContext", "same team already subscribed, skip", {
          teamId: nextTeamId,
          subscribedPath: `competitions/main/teams/${nextTeamId}`,
        });
        return;
      }

      unsubscribeTeamState?.();
      unsubscribeTeam?.();
      subscribedTeamIdRef.current = nextTeamId;
      setTeamId(nextTeamId);
      setLoading(true);
      patchLoadingDebug({ teamLoading: true });

      const subscribedPath = `competitions/main/teams/${nextTeamId}`;
      realLoadingDebug("useTeamCompetitionContext", "subscribed path", {
        teamId: nextTeamId,
        subscribedPath,
      });

      unsubscribeTeam = onSnapshot(
        teamRef(nextTeamId),
        (snapshot) => {
          const data = snapshot.data();
          setPlayers(Array.isArray(data?.players) ? data.players : []);
        },
        () => {
          setPlayers([]);
        },
      );

      unsubscribeTeamState = onSnapshot(
        teamStateRef("main", nextTeamId),
        (snapshot) => {
          realLoadingDebug("useTeamCompetitionContext", "snapshot received", {
            teamId: nextTeamId,
            subscribedPath,
            snapshotReceived: true,
            exists: snapshot.exists(),
          });

          if (!snapshot.exists()) {
            setTeamName("فريق");
            setLogoUrl(null);
            setReady(false);
            setCompetitionIntroReady(false);
            setStage1IntroReady(false);
            setTotalScore(0);
            setError(null);
            setLoading(false);
            patchLoadingDebug({ teamLoading: false });
            realLoadingDebug("useTeamCompetitionContext", "loading false reached (missing doc)", {
              teamId: nextTeamId,
            });
            return;
          }

          const data = snapshot.data();
          setTeamName(typeof data.teamName === "string" ? data.teamName : "فريق");
          setLogoUrl(typeof data.logoUrl === "string" ? data.logoUrl : null);
          setReady(data.ready === true);
          const readiness = data.readiness as Record<string, unknown> | undefined;
          setCompetitionIntroReady(readiness?.competitionIntro === true);
          setStage1IntroReady(readiness?.stage1Intro === true);
          setTotalScore(typeof data.totalScore === "number" ? data.totalScore : 0);
          setError(null);
          setLoading(false);
          patchLoadingDebug({ teamLoading: false });
          realLoadingDebug("useTeamCompetitionContext", "loading false reached", {
            teamId: nextTeamId,
            teamName: data.teamName,
          });
        },
        (listenerError) => {
          setError("تعذر تحميل بيانات الفريق.");
          setLoading(false);
          patchLoadingDebug({ teamLoading: false });
          realLoadingDebug("useTeamCompetitionContext", "loading false reached (listener error)", {
            teamId: nextTeamId,
            subscribedPath,
            snapshotReceived: false,
            error: listenerError instanceof Error ? listenerError.message : String(listenerError),
          });
        },
      );
    });

    return () => {
      unsubscribeTeamState?.();
      unsubscribeTeam?.();
      unsubscribeAuth();
      subscribedTeamIdRef.current = null;
    };
  }, []);

  return {
    teamId,
    teamName,
    logoUrl,
    ready,
    competitionIntroReady,
    stage1IntroReady,
    players,
    totalScore,
    loading,
    error,
  };
}
