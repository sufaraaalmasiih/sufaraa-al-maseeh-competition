"use client";

import { collection, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";
import { getClientFirestore } from "@/firebase/firebaseClient";

export interface RegisteredTeam {
  teamId: string;
  teamName: string;
  governorate: string;
  email: string;
  playersCount: number;
  createdAtMs: number;
}

function toMs(value: unknown): number {
  if (value && typeof value === "object" && "toMillis" in value) {
    try {
      return (value as { toMillis: () => number }).toMillis();
    } catch {
      return 0;
    }
  }
  return 0;
}

/** كل الفرق المسجّلة (لها حساب) — للمشرف العام. قد لا تكون كلها مشاركة في المسابقة الحالية. */
export function useAllRegisteredTeams() {
  const [teams, setTeams] = useState<RegisteredTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return onSnapshot(
      collection(getClientFirestore(), "teams"),
      (snapshot) => {
        const rows = snapshot.docs
          .map((document) => {
            const data = document.data();
            const players = Array.isArray(data.players) ? data.players : [];
            return {
              teamId: document.id,
              teamName: typeof data.teamName === "string" ? data.teamName : "فريق",
              governorate:
                typeof data.governorate === "string" ? data.governorate : "—",
              email: typeof data.email === "string" ? data.email : "",
              playersCount: players.length,
              createdAtMs: toMs(data.createdAt),
            } satisfies RegisteredTeam;
          })
          .sort((first, second) => first.teamName.localeCompare(second.teamName, "ar"));
        setTeams(rows);
        setError(null);
        setLoading(false);
      },
      () => {
        setError("تعذر تحميل الفرق المسجّلة.");
        setLoading(false);
      },
    );
  }, []);

  return { teams, loading, error };
}
