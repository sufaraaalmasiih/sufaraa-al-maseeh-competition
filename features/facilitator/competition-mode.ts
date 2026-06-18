import { getDoc, updateDoc } from "firebase/firestore";
import { gameFlowRef } from "@/firebase/firestore";

export type CompetitionMode = "official" | "training";

export function parseCompetitionMode(value: unknown): CompetitionMode {
  return value === "training" ? "training" : "official";
}

export function isTrainingMode(mode: CompetitionMode): boolean {
  return mode === "training";
}

export async function fetchCompetitionMode(): Promise<CompetitionMode> {
  const snapshot = await getDoc(gameFlowRef);
  return parseCompetitionMode(snapshot.data()?.competitionMode);
}

export async function writeCompetitionMode(input: {
  mode: CompetitionMode;
  trainingEndsAtMs: number | null;
}): Promise<void> {
  await updateDoc(gameFlowRef, {
    competitionMode: input.mode,
    trainingEndsAtMs:
      input.mode === "training" && typeof input.trainingEndsAtMs === "number"
        ? input.trainingEndsAtMs
        : null,
  });
}

export function parseTrainingEndsAtMs(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : null;
}
