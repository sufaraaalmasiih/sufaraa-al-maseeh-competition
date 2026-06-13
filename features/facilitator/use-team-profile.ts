"use client";

import { onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";
import { teamRef } from "@/firebase/firestore";
import type { TeamPlayer } from "@/types";

interface TeamProfileState {
  email: string;
  players: TeamPlayer[];
  loading: boolean;
  error: string | null;
}

const EMPTY_PLAYERS: TeamPlayer[] = [
  { name: "", type: "main" },
  { name: "", type: "main" },
  { name: "", type: "main" },
  { name: "", type: "main" },
  { name: "", type: "substitute" },
];

export function useTeamProfile(teamId: string | null): TeamProfileState {
  const [email, setEmail] = useState("");
  const [players, setPlayers] = useState<TeamPlayer[]>(EMPTY_PLAYERS);
  const [loading, setLoading] = useState(Boolean(teamId));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!teamId) {
      setEmail("");
      setPlayers(EMPTY_PLAYERS);
      setLoading(false);
      setError(null);
      return undefined;
    }

    setLoading(true);
    return onSnapshot(
      teamRef(teamId),
      (snapshot) => {
        const data = snapshot.data();
        setEmail(typeof data?.email === "string" ? data.email : "");
        if (Array.isArray(data?.players) && data.players.length > 0) {
          const next = [...EMPTY_PLAYERS];
          data.players.forEach((player, index) => {
            if (index < next.length && player && typeof player === "object") {
              next[index] = {
                name: typeof player.name === "string" ? player.name : "",
                type: player.type === "substitute" ? "substitute" : "main",
              };
            }
          });
          setPlayers(next);
        } else {
          setPlayers(EMPTY_PLAYERS);
        }
        setError(null);
        setLoading(false);
      },
      () => {
        setError("تعذر تحميل ملف الفريق.");
        setLoading(false);
      },
    );
  }, [teamId]);

  return { email, players, loading, error };
}
