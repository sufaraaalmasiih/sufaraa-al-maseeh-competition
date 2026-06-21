"use client";

import { collection, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";
import { getClientFirestore } from "@/firebase/firebaseClient";

export interface RegisteredCoach {
  coachId: string;
  name: string;
  email: string;
  linkedTeamId: string;
  linkedTeamName: string;
  passwordPlain: string;
}

interface AllCoachesState {
  coaches: RegisteredCoach[];
  loading: boolean;
  error: string | null;
}

function str(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

/** كل حسابات المدربين المسجّلة — للمشرف العام في تبويب الإدارة. */
export function useAllCoaches(): AllCoachesState {
  const [coaches, setCoaches] = useState<RegisteredCoach[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return onSnapshot(
      collection(getClientFirestore(), "coaches"),
      (snapshot) => {
        const rows = snapshot.docs
          .map((docSnap) => {
            const data = docSnap.data();
            return {
              coachId: docSnap.id,
              name: str(data.name, "مدرب"),
              email: str(data.email),
              linkedTeamId: str(data.linkedTeamId),
              linkedTeamName: str(data.linkedTeamName),
              passwordPlain: str(data.accountPasswordPlain),
            } satisfies RegisteredCoach;
          })
          .sort((a, b) => a.name.localeCompare(b.name, "ar"));
        setCoaches(rows);
        setError(null);
        setLoading(false);
      },
      () => {
        setError("تعذر تحميل حسابات المدربين.");
        setLoading(false);
      },
    );
  }, []);

  return { coaches, loading, error };
}
