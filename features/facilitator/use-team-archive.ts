"use client";

import {
  collection,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { getClientFirestore } from "@/firebase/firebaseClient";
import { MAIN_COMPETITION_ID } from "@/firebase/firestore";
import type { ArchiveTeam } from "@/features/facilitator/competition-session";

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

function teamArchivesCollection() {
  return collection(getClientFirestore(), "competitions", MAIN_COMPETITION_ID, "teamArchives");
}

/**
 * يكتب نسخة أرشيف لكل فريق في مجموعة منفصلة يقرأها الفريق نفسه فقط (خصوصية).
 * يُستدعى عند حفظ نتائج الجلسة. المعرّف ثابت لكل (جلسة، فريق) حتى يُحدَّث لا يتكرر.
 */
export async function writeTeamArchivesForSession(
  session: {
    sessionId: string;
    title: string;
    version: string;
    hostGovernorate: string;
    dateMs: number;
  },
  teams: ArchiveTeam[],
): Promise<void> {
  await Promise.all(
    teams.map((team) =>
      setDoc(
        doc(teamArchivesCollection(), `${session.sessionId}__${team.teamId}`),
        {
          teamId: team.teamId,
          teamName: team.teamName,
          sessionId: session.sessionId,
          title: session.title,
          version: session.version,
          hostGovernorate: session.hostGovernorate,
          dateMs: session.dateMs,
          total: team.total,
          rank: team.rank,
          stage1: team.stage1,
          stage2: team.stage2,
          stage3: team.stage3,
          stage4: team.stage4,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      ),
    ),
  );
}

function num(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function str(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

/**
 * أرشيف مشاركات فريق واحد. يقرأ من مجموعة teamArchives الخاصة (يراها الفريق نفسه،
 * والميسّر يرى الجميع). لا يكشف نتائج الفرق الأخرى.
 */
export function useTeamArchive(teamId: string | null, enabled = true) {
  const [participations, setParticipations] = useState<TeamArchiveParticipation[]>([]);
  const [loading, setLoading] = useState(Boolean(teamId) && enabled);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // لا نفتح مستمعاً إلا عند الحاجة (توفير قراءات الباقة المجانية).
    if (!teamId || !enabled) {
      setParticipations([]);
      setLoading(false);
      return undefined;
    }

    setLoading(true);
    return onSnapshot(
      query(teamArchivesCollection(), where("teamId", "==", teamId)),
      (snapshot) => {
        const rows = snapshot.docs
          .map((item) => {
            const data = item.data();
            return {
              sessionId: str(data.sessionId, item.id),
              title: str(data.title, "مسابقة"),
              version: str(data.version),
              hostGovernorate: str(data.hostGovernorate),
              dateMs: num(data.dateMs),
              total: num(data.total),
              rank: num(data.rank),
              stage1: num(data.stage1),
              stage2: num(data.stage2),
              stage3: num(data.stage3),
              stage4: num(data.stage4),
            } satisfies TeamArchiveParticipation;
          })
          .sort((first, second) => second.dateMs - first.dateMs);
        setParticipations(rows);
        setError(null);
        setLoading(false);
      },
      () => {
        setError("تعذر تحميل أرشيف الفريق.");
        setLoading(false);
      },
    );
  }, [teamId, enabled]);

  return { participations, count: participations.length, loading, error };
}
