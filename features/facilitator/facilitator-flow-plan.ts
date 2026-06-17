import type { GameFlowStatus } from "@/types";

export type FacilitatorStageKey =
  | "pre"
  | "stage1"
  | "stage2"
  | "stage3"
  | "stage4"
  | "final";

export type FacilitatorReadinessKey =
  | "competitionIntro"
  | "stage1Intro"
  | "stage2Intro"
  | "stage3Intro"
  | "stage4Intro";

export interface FacilitatorHeroAction {
  label: string;
  nextStatus: GameFlowStatus;
  nextStage: string;
  /** primary = normal advance, finish = ends a stage (stops timer), final = results/podium. */
  kind: "primary" | "finish" | "final";
}

export interface FacilitatorPhasePlan {
  stageKey: FacilitatorStageKey;
  stageName: string;
  phaseLabel: string;
  hint: string;
  hero: FacilitatorHeroAction | null;
  /** When set, the hero button is disabled until every team confirms this readiness flag. */
  readinessKey: FacilitatorReadinessKey | null;
  /** When true, stage-specific operator panels drive the flow (no linear hero button). */
  managedByPanel: boolean;
}

export const FACILITATOR_STAGE_NAMES: Record<FacilitatorStageKey, string> = {
  pre: "ما قبل المسابقة",
  stage1: "اجمعوا الكنوز",
  stage2: "فتشوا الكتب",
  stage3: "على المحك",
  stage4: "اثبتوا بالحق",
  final: "الختام",
};

export const FLOW_COCKPIT_ACCENTS: Record<
  FacilitatorStageKey,
  { accent: string; accentSoft: string; border: string }
> = {
  pre: {
    accent: "#2388c4",
    accentSoft: "rgba(35, 136, 196, 0.12)",
    border: "rgba(35, 136, 196, 0.18)",
  },
  stage1: {
    accent: "#4f8a10",
    accentSoft: "rgba(79, 138, 16, 0.12)",
    border: "rgba(79, 138, 16, 0.18)",
  },
  stage2: {
    accent: "#b45309",
    accentSoft: "rgba(180, 83, 9, 0.12)",
    border: "rgba(180, 83, 9, 0.18)",
  },
  stage3: {
    accent: "#1c75ab",
    accentSoft: "rgba(28, 117, 171, 0.12)",
    border: "rgba(28, 117, 171, 0.18)",
  },
  stage4: {
    accent: "#7c3aed",
    accentSoft: "rgba(124, 58, 237, 0.12)",
    border: "rgba(124, 58, 237, 0.18)",
  },
  final: {
    accent: "#cf8410",
    accentSoft: "rgba(207, 132, 16, 0.14)",
    border: "rgba(207, 132, 16, 0.2)",
  },
};

/** Finish action available while stage 3 is in active play (board through rounds). */
export const STAGE3_FINISH_HERO: FacilitatorHeroAction = {
  label: "إنهاء المرحلة الثالثة",
  nextStatus: "stage3_finished",
  nextStage: "stage3",
  kind: "finish",
};

/** Finish action available while stage 4 is in active play (waiting through reveal). */
export const STAGE4_FINISH_HERO: FacilitatorHeroAction = {
  label: "إنهاء المرحلة الرابعة",
  nextStatus: "stage4_finished",
  nextStage: "stage4",
  kind: "finish",
};

const PLAN: Record<GameFlowStatus, FacilitatorPhasePlan> = {
  waiting_players: {
    stageKey: "pre",
    stageName: FACILITATOR_STAGE_NAMES.pre,
    phaseLabel: "شاشة الانتظار",
    hint: "ننتظر انضمام الفرق. ابدأ المقدمة عند اكتمال الحضور.",
    hero: {
      label: "بدء مقدمة المسابقة",
      nextStatus: "competition_intro",
      nextStage: "none",
      kind: "primary",
    },
    readinessKey: null,
    managedByPanel: false,
  },
  competition_intro: {
    stageKey: "pre",
    stageName: FACILITATOR_STAGE_NAMES.pre,
    phaseLabel: "مقدمة المسابقة",
    hint: "تُعرض مقدمة المسابقة. تابع عندما تجهز كل الفرق.",
    hero: {
      label: "الانتقال لشرح المرحلة الأولى",
      nextStatus: "stage1_intro",
      nextStage: "stage1",
      kind: "primary",
    },
    readinessKey: "competitionIntro",
    managedByPanel: false,
  },
  stage1_intro: {
    stageKey: "stage1",
    stageName: FACILITATOR_STAGE_NAMES.stage1,
    phaseLabel: "شرح المرحلة",
    hint: "شرح المرحلة الأولى. ابدأ المرحلة عندما تجهز كل الفرق.",
    hero: {
      label: "بدء المرحلة الأولى",
      nextStatus: "stage1_running",
      nextStage: "stage1",
      kind: "primary",
    },
    readinessKey: "stage1Intro",
    managedByPanel: false,
  },
  stage1_running: {
    stageKey: "stage1",
    stageName: FACILITATOR_STAGE_NAMES.stage1,
    phaseLabel: "قيد التنفيذ",
    hint: "ابدأ المؤقت وراقب الترتيب المباشر. أنهِ المرحلة عند انتهاء الوقت أو البنك.",
    hero: {
      label: "إنهاء المرحلة الأولى",
      nextStatus: "stage1_finished",
      nextStage: "stage1",
      kind: "finish",
    },
    readinessKey: null,
    managedByPanel: false,
  },
  stage1_finished: {
    stageKey: "stage1",
    stageName: FACILITATOR_STAGE_NAMES.stage1,
    phaseLabel: "انتهت المرحلة",
    hint: "ظهرت نتائج المرحلة الأولى. انتقل إلى المرحلة الثانية.",
    hero: {
      label: "الانتقال لشرح المرحلة الثانية",
      nextStatus: "stage2_intro",
      nextStage: "stage2",
      kind: "primary",
    },
    readinessKey: null,
    managedByPanel: false,
  },
  stage2_intro: {
    stageKey: "stage2",
    stageName: FACILITATOR_STAGE_NAMES.stage2,
    phaseLabel: "شرح المرحلة",
    hint: "شرح مرحلة فتشوا الكتب. تابع لتوزيع المجالات عندما تجهز كل الفرق.",
    hero: {
      label: "الانتقال لتوزيع المجالات",
      nextStatus: "stage2_role_assignment",
      nextStage: "stage2",
      kind: "primary",
    },
    readinessKey: "stage2Intro",
    managedByPanel: false,
  },
  stage2_role_assignment: {
    stageKey: "stage2",
    stageName: FACILITATOR_STAGE_NAMES.stage2,
    phaseLabel: "توزيع المجالات",
    hint: "تُوزّع المجالات على اللاعبين. تابع عند اكتمال التوزيع.",
    hero: {
      label: "بدء قراءة المرجع",
      nextStatus: "stage2_reading",
      nextStage: "stage2",
      kind: "primary",
    },
    readinessKey: null,
    managedByPanel: false,
  },
  stage2_reading: {
    stageKey: "stage2",
    stageName: FACILITATOR_STAGE_NAMES.stage2,
    phaseLabel: "قراءة المرجع",
    hint: "بدأ مؤقت القراءة تلقائياً (3 دقائق). تابع لأسئلة المجالات بعد انتهائه.",
    hero: {
      label: "بدء أسئلة المجالات",
      nextStatus: "stage2_player_turns",
      nextStage: "stage2",
      kind: "primary",
    },
    readinessKey: null,
    managedByPanel: false,
  },
  stage2_player_turns: {
    stageKey: "stage2",
    stageName: FACILITATOR_STAGE_NAMES.stage2,
    phaseLabel: "أسئلة المجالات",
    hint: "راقب تقدم الفرق من لوحة العمل. انقل الفريق للمجال التالي بعد إنهاء أسئلة المجال الحالي.",
    hero: {
      label: "إنهاء المرحلة الثانية",
      nextStatus: "stage2_finished",
      nextStage: "stage2",
      kind: "finish",
    },
    readinessKey: null,
    managedByPanel: true,
  },
  stage2_finished: {
    stageKey: "stage2",
    stageName: FACILITATOR_STAGE_NAMES.stage2,
    phaseLabel: "انتهت المرحلة",
    hint: "ظهرت نتائج المرحلة الثانية. انتقل إلى مرحلة على المحك.",
    hero: {
      label: "الانتقال لشرح على المحك",
      nextStatus: "stage3_intro",
      nextStage: "stage3",
      kind: "primary",
    },
    readinessKey: null,
    managedByPanel: false,
  },
  stage3_intro: {
    stageKey: "stage3",
    stageName: FACILITATOR_STAGE_NAMES.stage3,
    phaseLabel: "شرح المرحلة",
    hint: "شرح مرحلة على المحك. ابدأ اللوحة عندما تجهز كل الفرق.",
    hero: {
      label: "بدء لوحة على المحك",
      nextStatus: "stage3_board",
      nextStage: "stage3",
      kind: "primary",
    },
    readinessKey: "stage3Intro",
    managedByPanel: false,
  },
  stage3_board: {
    stageKey: "stage3",
    stageName: FACILITATOR_STAGE_NAMES.stage3,
    phaseLabel: "اللوحة",
    hint: "أدر الأدوار من لوحة العمل. عند اكتمال الجولات، أنهِ المرحلة من الزر أدناه.",
    hero: STAGE3_FINISH_HERO,
    readinessKey: null,
    managedByPanel: true,
  },
  stage3_question_open: {
    stageKey: "stage3",
    stageName: FACILITATOR_STAGE_NAMES.stage3,
    phaseLabel: "سؤال مفتوح",
    hint: "تابع الإجابات من لوحة العمل. يمكنك إنهاء المرحلة بالكامل عند الحاجة.",
    hero: STAGE3_FINISH_HERO,
    readinessKey: null,
    managedByPanel: true,
  },
  stage3_answer_closed: {
    stageKey: "stage3",
    stageName: FACILITATOR_STAGE_NAMES.stage3,
    phaseLabel: "أُغلقت الإجابات",
    hint: "راجع الإجابات ثم ابدأ الإعلان. أو أنهِ المرحلة إذا انتهت الجولات.",
    hero: STAGE3_FINISH_HERO,
    readinessKey: null,
    managedByPanel: true,
  },
  stage3_reveal: {
    stageKey: "stage3",
    stageName: FACILITATOR_STAGE_NAMES.stage3,
    phaseLabel: "الإعلان",
    hint: "يُعرض الإعلان للجميع. بعد العودة للوحة يمكنك إنهاء المرحلة.",
    hero: STAGE3_FINISH_HERO,
    readinessKey: null,
    managedByPanel: true,
  },
  stage3_results_done: {
    stageKey: "stage3",
    stageName: FACILITATOR_STAGE_NAMES.stage3,
    phaseLabel: "انتهت الجولة",
    hint: "انتقل للدور التالي من اللوحة، أو أنهِ المرحلة الثالثة عند الاكتمال.",
    hero: STAGE3_FINISH_HERO,
    readinessKey: null,
    managedByPanel: true,
  },
  stage3_finished: {
    stageKey: "stage3",
    stageName: FACILITATOR_STAGE_NAMES.stage3,
    phaseLabel: "انتهت المرحلة",
    hint: "ظهرت نتائج على المحك. انتقل إلى المرحلة الرابعة.",
    hero: {
      label: "الانتقال لشرح المرحلة الرابعة",
      nextStatus: "stage4_intro",
      nextStage: "stage4",
      kind: "primary",
    },
    readinessKey: null,
    managedByPanel: false,
  },
  stage4_intro: {
    stageKey: "stage4",
    stageName: FACILITATOR_STAGE_NAMES.stage4,
    phaseLabel: "شرح المرحلة",
    hint: "اضبط عدد الأسئلة ومدة الإجابة في تبويب الإعدادات. تابع عندما تجهز كل الفرق.",
    hero: null,
    readinessKey: "stage4Intro",
    managedByPanel: true,
  },
  stage4_waiting_question: {
    stageKey: "stage4",
    stageName: FACILITATOR_STAGE_NAMES.stage4,
    phaseLabel: "بانتظار السؤال",
    hint: "افتح السؤال التالي عندما تكون الفرق جاهزة.",
    hero: STAGE4_FINISH_HERO,
    readinessKey: null,
    managedByPanel: true,
  },
  stage4_question_open: {
    stageKey: "stage4",
    stageName: FACILITATOR_STAGE_NAMES.stage4,
    phaseLabel: "سؤال مفتوح",
    hint: "تابع حالة إجابات الفرق. يُغلق وقت الإجابة تلقائياً عند انتهاء المؤقت.",
    hero: STAGE4_FINISH_HERO,
    readinessKey: null,
    managedByPanel: true,
  },
  stage4_answers_closed: {
    stageKey: "stage4",
    stageName: FACILITATOR_STAGE_NAMES.stage4,
    phaseLabel: "أُغلقت الإجابات",
    hint: "أظهر الإجابات لإعلان النتيجة.",
    hero: STAGE4_FINISH_HERO,
    readinessKey: null,
    managedByPanel: true,
  },
  stage4_reveal: {
    stageKey: "stage4",
    stageName: FACILITATOR_STAGE_NAMES.stage4,
    phaseLabel: "الإعلان",
    hint: "انتقل للسؤال التالي أو أنهِ المرحلة الرابعة.",
    hero: STAGE4_FINISH_HERO,
    readinessKey: null,
    managedByPanel: true,
  },
  stage4_finished: {
    stageKey: "stage4",
    stageName: FACILITATOR_STAGE_NAMES.stage4,
    phaseLabel: "انتهت المرحلة",
    hint: "ظهرت نتائج المرحلة الرابعة. اعرض النتائج النهائية.",
    hero: {
      label: "عرض النتائج النهائية",
      nextStatus: "final_results",
      nextStage: "final",
      kind: "final",
    },
    readinessKey: null,
    managedByPanel: false,
  },
  final_results: {
    stageKey: "final",
    stageName: FACILITATOR_STAGE_NAMES.final,
    phaseLabel: "النتائج النهائية",
    hint: "تُعرض النتائج النهائية. تابع لمنصة الفائزين.",
    hero: {
      label: "عرض منصة الفائزين",
      nextStatus: "podium",
      nextStage: "final",
      kind: "final",
    },
    readinessKey: null,
    managedByPanel: false,
  },
  podium: {
    stageKey: "final",
    stageName: FACILITATOR_STAGE_NAMES.final,
    phaseLabel: "منصة الفائزين",
    hint: "انتهت المسابقة. يمكنك إعادة الضبط من تبويب الإعدادات لبدء جولة جديدة.",
    hero: null,
    readinessKey: null,
    managedByPanel: false,
  },
};

export function getFacilitatorPhasePlan(
  status: GameFlowStatus | null,
): FacilitatorPhasePlan {
  if (!status) {
    return PLAN.waiting_players;
  }
  return PLAN[status] ?? PLAN.waiting_players;
}
