"use client";

import { useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  LayoutPanelTop,
  Loader2,
  Trophy,
} from "lucide-react";
import type { FacilitatorPhasePlan } from "@/features/facilitator/facilitator-flow-plan";
import { FacilitatorAdvanceConfirmDialog } from "@/features/facilitator/components/facilitator-advance-confirm-dialog";
import type { GameFlowStatus } from "@/types";
import { cn } from "@/lib/utils";

interface FacilitatorHeroActionProps {
  plan: FacilitatorPhasePlan;
  status: GameFlowStatus | null;
  readyCount: number | null;
  totalTeams: number;
  notReadyTeamNames?: string[];
  onAdvance: (plan: FacilitatorPhasePlan) => Promise<void>;
  embedded?: boolean;
}

function shouldShowHint(status: GameFlowStatus | null, plan: FacilitatorPhasePlan): boolean {
  if (!status || status === "waiting_players") {
    return false;
  }
  if (plan.managedByPanel && plan.hero?.kind === "finish") {
    return false;
  }
  return true;
}

export function FacilitatorHeroAction({
  plan,
  status,
  readyCount,
  totalTeams,
  notReadyTeamNames = [],
  onAdvance,
  embedded = false,
}: FacilitatorHeroActionProps) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const hero = plan.hero;
  const showHint = shouldShowHint(status, plan);

  const readinessBlocked =
    plan.readinessKey !== null &&
    totalTeams > 0 &&
    (readyCount ?? 0) < totalTeams;

  const Icon =
    hero?.kind === "finish"
      ? CheckCircle2
      : hero?.kind === "final"
        ? Trophy
        : ArrowLeft;

  async function handleClick() {
    if (pending || readinessBlocked || !hero) {
      return;
    }

    setConfirmOpen(true);
  }

  async function handleConfirmedAdvance() {
    if (pending || readinessBlocked || !hero) {
      return;
    }

    setPending(true);
    setError(null);
    try {
      await onAdvance(plan);
      setConfirmOpen(false);
    } catch {
      setError("تعذر تنفيذ الإجراء. حاول مرة أخرى.");
    } finally {
      setPending(false);
    }
  }

  const showWorkspaceNote = plan.managedByPanel && plan.hero?.kind === "finish";
  const showHead = showHint || showWorkspaceNote;

  return (
    <>
      <FacilitatorAdvanceConfirmDialog
        open={confirmOpen}
        title={hero?.label ?? "تأكيد الانتقال"}
        description={`هل تريد الانتقال إلى: «${hero?.label ?? "المرحلة التالية"}»؟`}
        confirmLabel={hero?.label ?? "تأكيد الانتقال"}
        pending={pending}
        onClose={() => {
          if (!pending) {
            setConfirmOpen(false);
          }
        }}
        onConfirm={() => {
          void handleConfirmedAdvance();
        }}
      />

      <div
      className={cn(
        embedded ? "flow-command__hero" : "flow-action",
        !embedded && plan.managedByPanel && "flow-action--managed",
        !embedded && hero?.kind === "finish" && "flow-action--finish-ready",
        !embedded && !showHint && hero && "flow-action--compact",
        embedded && plan.managedByPanel && "flow-command__hero--managed",
        embedded && hero?.kind === "finish" && "flow-command__hero--finish-ready",
      )}
    >
      <div className="flow-action__inner">
        {showHead ? (
          <div className="flow-action__head">
            {showHint ? <p className="flow-action__hint">{plan.hint}</p> : null}
            {showWorkspaceNote ? (
              <p className="flow-action__workspace-note">
                <LayoutPanelTop className="h-3.5 w-3.5 shrink-0" aria-hidden />
                <span>التحكم اليومي من لوحة العمل بالأسفل</span>
              </p>
            ) : null}
          </div>
        ) : null}

        {hero ? (
          <button
            type="button"
            className={cn(
              "flow-action__btn",
              hero.kind === "finish" && "flow-action__btn--finish",
              hero.kind === "final" && "flow-action__btn--final",
            )}
            disabled={pending || readinessBlocked}
            onClick={() => void handleClick()}
          >
            {pending ? (
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
            ) : (
              <Icon className="h-5 w-5" aria-hidden />
            )}
            <span>{pending ? "جاري التنفيذ..." : hero.label}</span>
          </button>
        ) : plan.managedByPanel ? (
          <p className="flow-action__empty-cta">استخدم لوحة العمل بالأسفل.</p>
        ) : null}
      </div>

      {readinessBlocked ? (
        <div className="flow-action__gate">
          <p>
            بانتظار جاهزية كل الفرق ({readyCount ?? 0} / {totalTeams})
          </p>
          {notReadyTeamNames.length > 0 ? (
            <p className="flow-action__gate-teams">
              غير جاهز: {notReadyTeamNames.join("، ")}
            </p>
          ) : null}
        </div>
      ) : null}
      {error ? <p className="facilitator-inline-error">{error}</p> : null}
    </div>
    </>
  );
}
