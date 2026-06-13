import type { FacilitatorStageKey } from "@/features/facilitator/facilitator-flow-plan";
import type { GameFlowStatus } from "@/types";

export interface FlowRailStep {
  key: FacilitatorStageKey;
  short: string;
  full: string;
  introLabel: string;
  playLabel: string;
}

export const FLOW_RAIL_STEPS: FlowRailStep[] = [
  {
    key: "pre",
    short: "البداية",
    full: "ما قبل المسابقة",
    introLabel: "مقدمة",
    playLabel: "انتظار",
  },
  {
    key: "stage1",
    short: "اجمعوا",
    full: "اجمعوا الكنوز",
    introLabel: "شرح",
    playLabel: "تنفيذ",
  },
  {
    key: "stage2",
    short: "فتشوا",
    full: "فتشوا الكتب",
    introLabel: "شرح",
    playLabel: "تنفيذ",
  },
  {
    key: "stage3",
    short: "المحك",
    full: "على المحك",
    introLabel: "شرح",
    playLabel: "تنفيذ",
  },
  {
    key: "stage4",
    short: "اثبتوا",
    full: "اثبتوا بالحق",
    introLabel: "شرح",
    playLabel: "تنفيذ",
  },
  {
    key: "final",
    short: "الختام",
    full: "النتائج والتتويج",
    introLabel: "نتائج",
    playLabel: "منصة",
  },
];

const STAGE_ORDER: Record<FacilitatorStageKey, number> = {
  pre: 0,
  stage1: 1,
  stage2: 2,
  stage3: 3,
  stage4: 4,
  final: 5,
};

const INTRO_STATUSES = new Set<GameFlowStatus>([
  "competition_intro",
  "stage1_intro",
  "stage2_intro",
  "stage3_intro",
  "stage4_intro",
]);

const PRE_WAITING = new Set<GameFlowStatus>(["waiting_players"]);

function stageKeyForStatus(status: GameFlowStatus): FacilitatorStageKey {
  if (PRE_WAITING.has(status) || status === "competition_intro") {
    return "pre";
  }
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
  return "final";
}

export type FlowRailPhase = "intro" | "play" | "waiting";

export function getActiveRailIndex(stageKey: FacilitatorStageKey): number {
  return STAGE_ORDER[stageKey];
}

export function getActiveRailPhase(status: GameFlowStatus): FlowRailPhase {
  if (PRE_WAITING.has(status)) {
    return "waiting";
  }
  if (INTRO_STATUSES.has(status)) {
    return "intro";
  }
  if (status === "final_results") {
    return "intro";
  }
  if (status === "podium") {
    return "play";
  }
  return "play";
}

export function resolveRailFromStatus(status: GameFlowStatus): {
  activeIndex: number;
  activePhase: FlowRailPhase;
} {
  const stageKey = stageKeyForStatus(status);
  return {
    activeIndex: getActiveRailIndex(stageKey),
    activePhase: getActiveRailPhase(status),
  };
}

export function getRailStepPhaseState(
  stepIndex: number,
  activeIndex: number,
  activePhase: FlowRailPhase,
  phaseKey: "intro" | "play",
): "done" | "active" | "upcoming" {
  if (stepIndex < activeIndex) {
    return "done";
  }
  if (stepIndex > activeIndex) {
    return "upcoming";
  }

  // pre: انتظار (play) then مقدمة (intro)
  if (stepIndex === 0 && activeIndex === 0) {
    if (activePhase === "waiting") {
      return phaseKey === "play" ? "active" : "upcoming";
    }
    if (activePhase === "intro") {
      return phaseKey === "intro" ? "active" : "done";
    }
  }

  if (phaseKey === "intro") {
    if (activePhase === "intro") {
      return "active";
    }
    if (activePhase === "play") {
      return "done";
    }
    return "upcoming";
  }

  if (activePhase === "play") {
    return "active";
  }
  return "upcoming";
}
