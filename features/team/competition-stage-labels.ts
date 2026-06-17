import { DEFAULT_COMPETITION_CONTENT } from "@/features/competition-content/competition-content-defaults";
import type { CompetitionContentDocument } from "@/features/competition-content/competition-content-types";
import type { GameFlowStatus } from "@/types";

type CompetitionStageKey = keyof CompetitionContentDocument["stages"];

function getStageKeyFromStatus(status: GameFlowStatus): CompetitionStageKey | null {
  if (status.startsWith("stage1_")) {
    return "stage1";
  }

  if (status.startsWith("stage2_")) {
    return "stage2";
  }

  if (status.startsWith("stage3_")) {
    return "stage3";
  }

  if (status.startsWith("stage4_")) {
    return "stage4";
  }

  return null;
}

export function getCompetitionStageLabel(
  status: GameFlowStatus | null,
  content: CompetitionContentDocument = DEFAULT_COMPETITION_CONTENT,
): string {
  if (!status) {
    return "المسابقة";
  }

  if (status === "final_results") {
    return "النتائج النهائية";
  }

  if (status === "podium") {
    return "منصة التكريم";
  }

  const stageKey = getStageKeyFromStatus(status);
  if (stageKey) {
    return content.stages[stageKey].name;
  }

  return "المسابقة";
}

export function isTeamGameplayStatus(status: GameFlowStatus | null): boolean {
  if (!status) {
    return false;
  }

  return (
    status.startsWith("stage1_") ||
    status.startsWith("stage2_") ||
    status.startsWith("stage3_") ||
    status.startsWith("stage4_") ||
    status === "final_results" ||
    status === "podium"
  );
}
