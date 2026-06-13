"use client";

import { onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";
import { teamStatesCollectionRef } from "@/firebase/firestore";

const MAIN_COMPETITION_ID = "main";

export interface Stage4RankedTeam {
  teamId: string;
  teamName: string;
  governorate: string;
  stage4Score: number;
  totalScore: number;
  streak: number;
}

export function useStage4Ranking() {
  const [teams, setTeams] = useState<Stage4RankedTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return onSnapshot(
      teamStatesCollectionRef(MAIN_COMPETITION_ID),
      (snapshot) => {
        const rows = snapshot.docs.map((doc) => {
          const data = doc.data();

          return {
            teamId: typeof data.teamId === "string" ? data.teamId : doc.id,
            teamName: typeof data.teamName === "string" ? data.teamName : "فريق بدون اسم",
            governorate: typeof data.governorate === "string" ? data.governorate : "غير محددة",
            stage4Score:
              data.stageScores && typeof data.stageScores.stage4 === "number"
                ? data.stageScores.stage4
                : 0,
            totalScore: typeof data.totalScore === "number" ? data.totalScore : 0,
            streak:
              data.stage4 && typeof data.stage4.streak === "number" ? data.stage4.streak : 0,
          };
        });

        rows.sort((first, second) => {
          if (second.stage4Score !== first.stage4Score) {
            return second.stage4Score - first.stage4Score;
          }

          return first.teamName.localeCompare(second.teamName, "ar");
        });

        setTeams(rows);
        setError(null);
        setLoading(false);
      },
      () => {
        setError("تعذر تحميل ترتيب المرحلة الرابعة.");
        setLoading(false);
      },
    );
  }, []);

  return { teams, loading, error };
}
