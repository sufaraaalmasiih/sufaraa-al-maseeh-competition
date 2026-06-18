"use client";

import { useMemo } from "react";
import { useCompetitionHistory } from "@/features/facilitator/competition-session";

export interface TeamArchiveParticipation {
  sessionId: string;
  title: string;
  version: string;
  hostGovernorate: string;
  dateMs: number;
  total: number;
  rank: number;
  stage1: number;
  stage2: number;
  stage3: number;
  stage4: number;
}

/**
 * أرشيف مشاركات فريق واحد عبر كل سجلّات المسابقات السابقة.
 * يقرأ سجل المسابقات ثم يستخرج نتيجة هذا الفريق في كل جلسة شارك فيها.
 */
export function useTeamArchive(teamId: string | null) {
  const { archives, loading, error } = useCompetitionHistory();

  const participations = useMemo<TeamArchiveParticipation[]>(() => {
    if (!teamId) {
      return [];
    }

    return archives.flatMap((session) => {
      const entry = session.teams.find((team) => team.teamId === teamId);
      if (!entry) {
        return [];
      }

      return [
        {
          sessionId: session.id,
          title: session.title,
          version: session.version,
          hostGovernorate: session.hostGovernorate,
          dateMs: session.resultsSavedAtMs ?? session.startedAtMs,
          total: entry.total,
          rank: entry.rank,
          stage1: entry.stage1,
          stage2: entry.stage2,
          stage3: entry.stage3,
          stage4: entry.stage4,
        },
      ];
    });
  }, [archives, teamId]);

  return { participations, count: participations.length, loading, error };
}
