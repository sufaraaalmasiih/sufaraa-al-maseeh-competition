"use client";

import { useEffect, useRef, useState } from "react";
import { ErrorState } from "@/components/layout/state-view";
import { Button } from "@/components/ui/button";
import { TimerCountdown } from "@/features/gameflow/components/timer-countdown";
import { useCompetitionTimer } from "@/features/gameflow/use-competition-timer";
import { Stage3Board } from "@/features/stage3/components/stage3-board";
import { advanceStage3Turn } from "@/features/stage3/advance-stage3-turn";
import { handleStage3SelectionTimeout } from "@/features/stage3/handle-stage3-selection-timeout";
import { setStage3OwnerTeam } from "@/features/stage3/set-stage3-owner";
import { startStage3OfficialFlow } from "@/features/stage3/start-stage3-official-flow";
import { Stage3SelectionTimeoutBanner } from "@/features/stage3/components/stage3-selection-timeout-banner";
import { STAGE3_NAME } from "@/features/stage3/stage3-constants";
import type { Stage3SelectionTimeoutNotice } from "@/features/stage3/stage3-selection-timeout-notice";

interface FacilitatorTeamOption {
  teamId: string;
  teamName: string;
}

interface Stage3FacilitatorBoardPanelProps {
  openedQuestionIds: string[];
  usedQuestionIds: string[];
  teams: FacilitatorTeamOption[];
  ownerTeamId: string | null;
  ownerTeamName: string | null;
  selectionTimeoutNotice: Stage3SelectionTimeoutNotice | null;
}

export function Stage3FacilitatorBoardPanel({
  openedQuestionIds,
  usedQuestionIds,
  teams,
  ownerTeamId,
  ownerTeamName,
  selectionTimeoutNotice,
}: Stage3FacilitatorBoardPanelProps) {
  const { timer, remainingSeconds, isExpired } = useCompetitionTimer();
  const [selectedOwnerTeamId, setSelectedOwnerTeamId] = useState(ownerTeamId ?? "");
  const [starting, setStarting] = useState(false);
  const [rotating, setRotating] = useState(false);
  const [savingOwner, setSavingOwner] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const selectionTimeoutAttemptedRef = useRef(false);

  useEffect(() => {
    setSelectedOwnerTeamId(ownerTeamId ?? "");
  }, [ownerTeamId]);

  useEffect(() => {
    selectionTimeoutAttemptedRef.current = false;
  }, [ownerTeamId, timer?.endsAtMs]);

  useEffect(() => {
    if (
      selectionTimeoutAttemptedRef.current ||
      !isExpired ||
      !timer?.active ||
      timer.stage !== "stage3" ||
      timer.purpose !== "selection"
    ) {
      return;
    }

    selectionTimeoutAttemptedRef.current = true;

    void handleStage3SelectionTimeout().catch(() => {
      selectionTimeoutAttemptedRef.current = false;
    });
  }, [isExpired, timer?.active, timer?.endsAtMs, timer?.purpose, timer?.stage]);

  const selectedOwnerTeam = teams.find((team) => team.teamId === selectedOwnerTeamId);
  const isSelectionTimer =
    timer?.active && timer.stage === "stage3" && timer.purpose === "selection";

  async function handleStartOfficialFlow() {
    setStarting(true);
    setError(null);

    try {
      await startStage3OfficialFlow();
    } catch {
      setError("تعذر بدء المرحلة الرسمية.");
    } finally {
      setStarting(false);
    }
  }

  async function handleRotateTurn() {
    setRotating(true);
    setError(null);

    try {
      await advanceStage3Turn({ rotateOwner: true });
    } catch {
      setError("تعذر تغيير الدور.");
    } finally {
      setRotating(false);
    }
  }

  async function handleSaveOwnerOverride() {
    if (!selectedOwnerTeam) {
      setError("اختر فريقاً للتدخل اليدوي.");
      return;
    }

    setSavingOwner(true);
    setError(null);

    try {
      await setStage3OwnerTeam(selectedOwnerTeam.teamId, selectedOwnerTeam.teamName);
    } catch {
      setError("تعذر حفظ تدخل الميسّر.");
    } finally {
      setSavingOwner(false);
    }
  }

  return (
    <div className="stage3-scene">
      <Stage3SelectionTimeoutBanner notice={selectionTimeoutNotice} />
      {error ? <ErrorState title="تعذر المتابعة" description={error} /> : null}

      <div className="glass-card-premium px-5 py-5 sm:px-6">
        <p className="text-center text-sm font-bold text-[#4F8A10]">{STAGE3_NAME} — مراقبة اللوحة</p>
        <h2 className="mt-1 text-center text-xl font-black text-[#143A5A]">الدور الحالي</h2>
        <p className="mt-2 text-center text-sm text-[#143A5A]/70">
          الترتيب يُحسب تلقائياً حسب النقاط — الفريق صاحب الدور يختار من شاشة الفريق.
        </p>

        {isSelectionTimer ? (
          <div className="mt-4">
            <TimerCountdown
              remainingSeconds={remainingSeconds}
              isExpired={isExpired}
              label="وقت اختيار السؤال"
            />
          </div>
        ) : null}

        <div className="mt-4 flex flex-wrap justify-center gap-3">
          <Button type="button" disabled={starting} onClick={() => void handleStartOfficialFlow()}>
            {starting ? "جاري البدء..." : "بدء المرحلة الرسمية"}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={rotating}
            onClick={() => void handleRotateTurn()}
          >
            {rotating ? "جاري التغيير..." : "تغيير الدور (يدوي)"}
          </Button>
        </div>

        <details className="mt-4 rounded-xl border border-[#2388C4]/15 bg-white/50 px-4 py-3">
          <summary className="cursor-pointer text-sm font-bold text-[#143A5A]">
            تدخل طوارئ — تعيين صاحب الدور يدوياً
          </summary>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="min-w-[12rem] flex-1">
              <label className="mb-2 block text-sm font-bold text-[#143A5A]" htmlFor="stage3-owner">
                الفريق
              </label>
              <select
                id="stage3-owner"
                className="w-full rounded-xl border border-[#2388C4]/20 bg-white/80 px-3 py-2.5 text-sm font-semibold"
                value={selectedOwnerTeamId}
                onChange={(event) => setSelectedOwnerTeamId(event.target.value)}
              >
                <option value="">— اختر فريقاً —</option>
                {teams.map((team) => (
                  <option key={team.teamId} value={team.teamId}>
                    {team.teamName}
                  </option>
                ))}
              </select>
            </div>
            <Button
              type="button"
              variant="outline"
              disabled={!selectedOwnerTeamId || savingOwner}
              onClick={() => void handleSaveOwnerOverride()}
            >
              {savingOwner ? "جاري الحفظ..." : "حفظ التدخل"}
            </Button>
          </div>
        </details>

        <div className="stage3-facilitator-status-grid mt-4">
          <StatusCard label="صاحب الدور" value={ownerTeamName ?? "لم يُحدد"} highlight />
          <StatusCard label="الأسئلة المُستخدمة" value={String(usedQuestionIds.length)} />
          <StatusCard label="الأسئلة المفتوحة" value={String(openedQuestionIds.length)} />
          <StatusCard
            label="الحالة"
            value={ownerTeamId ? "بانتظار اختيار السؤال" : "لم تبدأ المرحلة"}
          />
        </div>
      </div>

      <Stage3Board
        variant="facilitator"
        canChoose={false}
        openedQuestionIds={openedQuestionIds}
        usedQuestionIds={usedQuestionIds}
        ownerTeamName={ownerTeamName}
      />
    </div>
  );
}

function StatusCard({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`stage3-facilitator-status-card ${highlight ? "border-[#4F8A10]/25 bg-[#F0FAE6]/60" : ""}`}
    >
      <p className="text-xs font-bold text-[#143A5A]/60">{label}</p>
      <p className="mt-1 text-base font-black text-[#143A5A]">{value}</p>
    </div>
  );
}
