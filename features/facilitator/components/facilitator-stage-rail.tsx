"use client";

import { Check } from "lucide-react";
import {
  FLOW_RAIL_STEPS,
  getRailStepPhaseState,
  resolveRailFromStatus,
} from "@/features/facilitator/facilitator-stage-rail";
import { cn } from "@/lib/utils";
import type { GameFlowStatus } from "@/types";

interface FacilitatorStageRailProps {
  status: GameFlowStatus;
}

export function FacilitatorStageRail({ status }: FacilitatorStageRailProps) {
  const { activeIndex, activePhase } = resolveRailFromStatus(status);

  return (
    <nav className="flow-rail" aria-label="مسار المراحل">
      <ol className="flow-rail__track">
        {FLOW_RAIL_STEPS.map((step, index) => {
          const stepState =
            index < activeIndex ? "done" : index === activeIndex ? "active" : "upcoming";
          const introState = getRailStepPhaseState(
            index,
            activeIndex,
            activePhase,
            "intro",
          );
          const playState = getRailStepPhaseState(
            index,
            activeIndex,
            activePhase,
            "play",
          );

          return (
            <li
              key={step.key}
              className={cn(
                "flow-rail__step",
                stepState === "done" && "flow-rail__step--done",
                stepState === "active" && "flow-rail__step--active",
                stepState === "upcoming" && "flow-rail__step--upcoming",
              )}
              aria-current={stepState === "active" ? "step" : undefined}
            >
              <div className="flow-rail__node">
                {stepState === "done" ? (
                  <Check className="flow-rail__check" aria-hidden />
                ) : (
                  <span className="flow-rail__num">{index + 1}</span>
                )}
              </div>

              <div className="flow-rail__copy">
                <span className="flow-rail__short">{step.short}</span>
                <span className="flow-rail__full">{step.full}</span>
              </div>

              <div className="flow-rail__phase-track" role="group" aria-label={`مراحل ${step.short}`}>
                <span
                  className={cn(
                    "flow-rail__phase",
                    introState === "active" && "flow-rail__phase--active",
                    introState === "done" && "flow-rail__phase--done",
                    introState === "upcoming" && "flow-rail__phase--upcoming",
                  )}
                >
                  {step.introLabel}
                </span>
                <span
                  className={cn(
                    "flow-rail__phase",
                    playState === "active" && "flow-rail__phase--active",
                    playState === "done" && "flow-rail__phase--done",
                    playState === "upcoming" && "flow-rail__phase--upcoming",
                  )}
                >
                  {step.playLabel}
                </span>
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
