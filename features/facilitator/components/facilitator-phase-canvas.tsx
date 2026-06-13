"use client";

import {
  BookOpen,
  Gem,
  Grid3x3,
  Megaphone,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import type { FacilitatorPhasePlan } from "@/features/facilitator/facilitator-flow-plan";
import type { FacilitatorStageKey } from "@/features/facilitator/facilitator-flow-plan";
import { cn } from "@/lib/utils";
import type { GameFlowStatus } from "@/types";

const STAGE_ICONS: Record<FacilitatorStageKey, typeof Gem> = {
  pre: Users,
  stage1: Gem,
  stage2: BookOpen,
  stage3: Grid3x3,
  stage4: Zap,
  final: Trophy,
};

const STAGE_TAGS: Partial<Record<GameFlowStatus, string>> = {
  waiting_players: "بانتظار انضمام الفرق",
  competition_intro: "مقدمة للجمهور والفرق",
  stage1_intro: "شرح قبل البدء",
  stage1_running: "جارية الآن",
  stage1_finished: "نتائج المرحلة الأولى",
  stage2_intro: "شرح قبل البدء",
  stage2_role_assignment: "توزيع الأدوار",
  stage2_reading: "وقت القراءة",
  stage2_player_turns: "أسئلة المجالات",
  stage2_finished: "نتائج المرحلة الثانية",
  stage3_intro: "شرح لوحة Jeopardy",
  final_results: "عرض شامل",
  podium: "تتويج الفائزين",
};

interface FacilitatorPhaseCanvasProps {
  plan: FacilitatorPhasePlan;
  status: GameFlowStatus;
}

export function FacilitatorPhaseCanvas({ plan, status }: FacilitatorPhaseCanvasProps) {
  const Icon = STAGE_ICONS[plan.stageKey];
  const tag = STAGE_TAGS[status] ?? plan.phaseLabel;

  return (
    <section
      className={cn("flow-canvas", `flow-canvas--${plan.stageKey}`)}
      aria-label={`مساحة ${plan.stageName}`}
    >
      <div className="flow-canvas__glow" aria-hidden />
      <div className="flow-canvas__inner">
        <div className="flow-canvas__icon-wrap">
          <Icon className="flow-canvas__icon" aria-hidden />
        </div>
        <div className="flow-canvas__body">
          <span className="flow-canvas__tag">{tag}</span>
          <h3 className="flow-canvas__title">{plan.stageName}</h3>
          <p className="flow-canvas__hint">{plan.hint}</p>
          {plan.managedByPanel && !plan.hero ? (
            <p className="flow-canvas__managed">
              <Megaphone className="h-4 w-4 shrink-0" aria-hidden />
              تُدار هذه المرحلة من لوحة العمل أدناه — استخدم أدوات التحكم المدمجة.
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
