"use client";

import { Lock, LockOpen } from "lucide-react";
import { LoadingState } from "@/components/layout/state-view";
import { STAGE_LOCK_OPTIONS } from "@/features/facilitator/facilitator-controls-copy";
import type { ControlsConfirmRequest } from "@/features/facilitator/components/facilitator-controls-confirm-card";
import type { AdminStageKey } from "@/features/facilitator/facilitator-team-admin";

interface FacilitatorControlsGlobalLocksPanelProps {
  activeLocks: Record<AdminStageKey, boolean>;
  globalLocksMixed: boolean;
  globalLocksLoading: boolean;
  confirmRequest: ControlsConfirmRequest | null;
  onToggleLock: (stage: AdminStageKey, locked: boolean) => void;
}

export function FacilitatorControlsGlobalLocksPanel({
  activeLocks,
  globalLocksMixed,
  globalLocksLoading,
  confirmRequest,
  onToggleLock,
}: FacilitatorControlsGlobalLocksPanelProps) {
  return (
    <div className="facilitator-card">
      <div className="facilitator-card__head">
        <Lock className="h-5 w-5 text-[#2388C4]" aria-hidden />
        <div>
          <h3 className="facilitator-card__title">قفل وفتح المراحل — جميع الفرق</h3>
          <p className="facilitator-card__desc">
            المرحلة المقفلة تمنع الفريق من خوضها حتى يعيد الميسر فتحها.
          </p>
        </div>
      </div>

      {globalLocksMixed ? (
        <p className="facilitator-inline-error">
          حالة القفل مختلفة بين الفرق. أي زر تضغطه يُطبَّق على الجميع.
        </p>
      ) : null}

      {globalLocksLoading ? <LoadingState variant="inline" /> : null}

      <div className="facilitator-controls-lock-grid">
        {STAGE_LOCK_OPTIONS.map((option) => {
          const locked = activeLocks[option.key];
          return (
            <div key={option.key} className="facilitator-controls-lock-row">
              <span>{option.label}</span>
              <div className="facilitator-timer__buttons">
                <button
                  type="button"
                  className="facilitator-btn facilitator-btn--outline"
                  disabled={confirmRequest !== null || locked === false}
                  onClick={() => onToggleLock(option.key, false)}
                >
                  <LockOpen className="h-4 w-4" aria-hidden />
                  فتح
                </button>
                <button
                  type="button"
                  className="facilitator-btn facilitator-btn--danger"
                  disabled={confirmRequest !== null || locked === true}
                  onClick={() => onToggleLock(option.key, true)}
                >
                  <Lock className="h-4 w-4" aria-hidden />
                  قفل
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
