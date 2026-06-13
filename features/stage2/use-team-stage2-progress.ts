"use client";

import { onAuthStateChanged } from "firebase/auth";
import { onSnapshot } from "firebase/firestore";
import { useEffect, useRef, useState } from "react";
import { firebaseAuth } from "@/firebase/firebaseClient";
import { teamStateRef } from "@/firebase/firestore";
import {
  normalizeStage2Progress,
  type Stage2ProgressState,
} from "@/features/stage2/stage2-progress";
import {
  emptyStage2Roles,
  type Stage2Roles,
} from "@/features/stage2/stage2-types";
import { patchLoadingDebug } from "@/lib/loading-debug-store";
import { realLoadingDebug } from "@/lib/real-loading-debug";

interface TeamStage2ProgressData {
  teamId: string | null;
  roles: Stage2Roles;
  progress: Stage2ProgressState;
  loading: boolean;
  error: string | null;
}

const defaultProgress = normalizeStage2Progress(undefined);

export function useTeamStage2Progress(): TeamStage2ProgressData {
  const [teamId, setTeamId] = useState<string | null>(null);
  const [roles, setRoles] = useState<Stage2Roles>(emptyStage2Roles);
  const [progress, setProgress] = useState<Stage2ProgressState>(defaultProgress);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const subscribedTeamIdRef = useRef<string | null>(null);

  useEffect(() => {
    realLoadingDebug("useTeamStage2Progress", "hook mounted, subscribing auth");
    let unsubscribeTeamState: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(firebaseAuth, (user) => {
      if (!user) {
        unsubscribeTeamState?.();
        unsubscribeTeamState = undefined;
        subscribedTeamIdRef.current = null;
        setTeamId(null);
        setRoles(emptyStage2Roles);
        setProgress(defaultProgress);
        setError(null);
        setLoading(false);
        patchLoadingDebug({ stage2ProgressLoading: false });
        realLoadingDebug("useTeamStage2Progress", "loading false reached (no user)");
        return;
      }

      const nextTeamId = user.uid;
      const listenerPath = `competitions/main/teams/${nextTeamId}`;
      if (subscribedTeamIdRef.current === nextTeamId && unsubscribeTeamState) {
        realLoadingDebug("useTeamStage2Progress", "same team already subscribed, skip", {
          teamId: nextTeamId,
          listenerPath,
        });
        return;
      }

      unsubscribeTeamState?.();
      subscribedTeamIdRef.current = nextTeamId;
      setTeamId(nextTeamId);
      setLoading(true);
      patchLoadingDebug({ stage2ProgressLoading: true });
      realLoadingDebug("useTeamStage2Progress", "subscribing team doc listener", {
        teamId: nextTeamId,
        listenerPath,
      });

      unsubscribeTeamState = onSnapshot(
        teamStateRef("main", nextTeamId),
        (snapshot) => {
          const data = snapshot.data();
          const nextProgress = normalizeStage2Progress(
            data?.progress as Record<string, unknown> | undefined,
          );
          realLoadingDebug("useTeamStage2Progress", "snapshot received", {
            teamId: nextTeamId,
            listenerPath,
            snapshotReceived: true,
            exists: snapshot.exists(),
            stage2FieldIndex: nextProgress.stage2FieldIndex,
            stage2QuestionIndex: nextProgress.stage2QuestionIndex,
            currentField: nextProgress.currentField?.key ?? null,
            rolesLocked: data?.stage2Roles?.locked === true,
          });
          setRoles({
            ...emptyStage2Roles,
            ...(data?.stage2Roles ?? {}),
          });
          setProgress(nextProgress);
          setError(null);
          setLoading(false);
          patchLoadingDebug({ stage2ProgressLoading: false });
          realLoadingDebug("useTeamStage2Progress", "loading false reached", {
            teamId: nextTeamId,
          });
        },
        (listenerError) => {
          setError("تعذر تحميل تقدم المرحلة الثانية.");
          setLoading(false);
          patchLoadingDebug({ stage2ProgressLoading: false });
          realLoadingDebug("useTeamStage2Progress", "loading false reached (listener error)", {
            teamId: nextTeamId,
            listenerPath,
            snapshotReceived: false,
            error: listenerError instanceof Error ? listenerError.message : String(listenerError),
          });
        },
      );
    });

    return () => {
      unsubscribeTeamState?.();
      unsubscribeAuth();
      subscribedTeamIdRef.current = null;
    };
  }, []);

  return { teamId, roles, progress, loading, error };
}
