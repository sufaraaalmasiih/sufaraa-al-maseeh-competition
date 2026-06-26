"use client";

import { useState } from "react";
import { AlertTriangle, ChevronDown } from "lucide-react";
import { finishStage, setGameFlowStatus } from "@/features/facilitator/facilitator-flow-actions";
import {
  jumpToManualQuestion,
  type ManualQuestionJumpStage,
} from "@/features/facilitator/manual-question-jump-actions";
import { startStage3Reveal } from "@/features/stage3/start-stage3-reveal";
import { resetCompetition } from "@/features/gameflow/competition-reset";
import { cn } from "@/lib/utils";
import type { GameFlowStatus } from "@/types";

interface ManualControl {
  label: string;
  status: GameFlowStatus;
  currentStage: string;
}

const MANUAL_CONTROLS: ManualControl[] = [
  { label: "شاشة الانتظار", status: "waiting_players", currentStage: "none" },
  { label: "مقدمة المسابقة", status: "competition_intro", currentStage: "none" },
  { label: "شرح المرحلة الأولى", status: "stage1_intro", currentStage: "stage1" },
  { label: "بدء المرحلة الأولى", status: "stage1_running", currentStage: "stage1" },
  { label: "إنهاء المرحلة الأولى", status: "stage1_finished", currentStage: "stage1" },
  { label: "شرح المرحلة الثانية", status: "stage2_intro", currentStage: "stage2" },
  { label: "توزيع المجالات", status: "stage2_role_assignment", currentStage: "stage2" },
  { label: "قراءة المرجع", status: "stage2_reading", currentStage: "stage2" },
  { label: "أسئلة المرحلة الثانية", status: "stage2_player_turns", currentStage: "stage2" },
  { label: "إنهاء المرحلة الثانية", status: "stage2_finished", currentStage: "stage2" },
  { label: "شرح مرحلة على المحك", status: "stage3_intro", currentStage: "stage3" },
  { label: "لوحة على المحك", status: "stage3_board", currentStage: "stage3" },
  { label: "الإعلان (على المحك)", status: "stage3_reveal", currentStage: "stage3" },
  { label: "إنهاء المرحلة الثالثة", status: "stage3_finished", currentStage: "stage3" },
  { label: "شرح المرحلة الرابعة", status: "stage4_intro", currentStage: "stage4" },
  { label: "اثبتوا بالحق — بانتظار السؤال", status: "stage4_waiting_question", currentStage: "stage4" },
  { label: "إنهاء المرحلة الرابعة", status: "stage4_finished", currentStage: "final" },
  { label: "النتائج النهائية", status: "final_results", currentStage: "final" },
  { label: "منصة الفائزين", status: "podium", currentStage: "final" },
];

interface FacilitatorManualJumpProps {
  status: GameFlowStatus | null;
  embedded?: boolean;
}

export function FacilitatorManualJump({ status, embedded = false }: FacilitatorManualJumpProps) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState<GameFlowStatus | null>(null);
  const [questionJumpPending, setQuestionJumpPending] = useState<ManualQuestionJumpStage | null>(null);
  const [questionNumbers, setQuestionNumbers] = useState<Record<ManualQuestionJumpStage, string>>({
    stage1: "1",
    stage2: "1",
    stage4: "1",
  });
  const [error, setError] = useState<string | null>(null);

  async function handle(control: ManualControl) {
    // العودة لوضع الاستعداد = الوضع الطبيعي: تصفير كل العلامات وإعادة المسابقة للبداية.
    if (control.status === "waiting_players") {
      if (
        !window.confirm(
          "العودة لوضع الاستعداد ستُصفّر كل علامات الفرق وتُعيد المسابقة للوضع الطبيعي (تبقى الفرق مسجّلة الدخول). متابعة؟",
        )
      ) {
        return;
      }
      setPending(control.status);
      setError(null);
      try {
        await resetCompetition();
      } catch {
        setError("تعذر العودة لوضع الاستعداد.");
      } finally {
        setPending(null);
      }
      return;
    }

    setPending(control.status);
    setError(null);
    try {
      if (control.status === "stage1_finished") {
        await finishStage(1);
      } else if (control.status === "stage2_finished") {
        await finishStage(2);
      } else if (control.status === "stage3_finished") {
        await finishStage(3);
      } else if (control.status === "stage4_finished") {
        await finishStage(4);
      } else if (control.status === "stage3_reveal") {
        if (status === "stage3_question_open") {
          await startStage3Reveal();
        } else if (status !== "stage3_reveal") {
          setError("الإعلان متاح فقط بعد فتح سؤال على المحك.");
          return;
        }
      } else {
        await setGameFlowStatus(control.status, control.currentStage);
      }
    } catch {
      setError("تعذر تغيير الحالة يدوياً.");
    } finally {
      setPending(null);
    }
  }

  async function handleQuestionJump(stage: ManualQuestionJumpStage) {
    const questionNumber = Number(questionNumbers[stage]);
    if (!Number.isFinite(questionNumber) || questionNumber < 1) {
      setError("أدخل رقم سؤال صحيحاً أكبر من صفر.");
      return;
    }

    setQuestionJumpPending(stage);
    setError(null);
    try {
      await jumpToManualQuestion(stage, questionNumber);
    } catch {
      setError("تعذر نقلك إلى رقم السؤال المطلوب.");
    } finally {
      setQuestionJumpPending(null);
    }
  }

  return (
    <div className={cn("flow-manual", embedded && "flow-manual--embedded")}>
      <button
        type="button"
        className={cn("flow-manual__toggle", open && "flow-manual__toggle--open")}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <AlertTriangle className="flow-manual__toggle-icon" aria-hidden />
        <span className="flow-manual__toggle-label">تحكم يدوي متقدم</span>
        <ChevronDown className="flow-manual__toggle-chevron" aria-hidden />
      </button>

      <div
        className={cn("flow-manual__panel", open && "flow-manual__panel--open")}
        aria-hidden={!open}
      >
        <div className="flow-manual__panel-inner">
          <p className="flow-manual__warn">
            للطوارئ والاختبار فقط — قد يتخطى القفز اليدوي الإعلان أو دورة المرحلة.
          </p>
          <div className="flow-manual__grid">
            {MANUAL_CONTROLS.map((control) => (
              <button
                key={control.status}
                type="button"
                className={cn(
                  "facilitator-jump-btn",
                  status === control.status && "facilitator-jump-btn--active",
                )}
                disabled={pending !== null}
                onClick={() => void handle(control)}
              >
                {pending === control.status ? "..." : control.label}
              </button>
            ))}
          </div>
          <div className="flow-manual__question-jump">
            <p className="flow-manual__question-jump-title">انتقال مباشر إلى سؤال داخل المرحلة</p>
            {([
              ["stage1", "المرحلة الأولى"],
              ["stage2", "المرحلة الثانية"],
              ["stage4", "المرحلة الرابعة"],
            ] as const).map(([stage, label]) => (
              <label key={stage} className="flow-manual__question-jump-row">
                <span>{label}</span>
                <input
                  type="number"
                  min={1}
                  inputMode="numeric"
                  value={questionNumbers[stage]}
                  onChange={(event) =>
                    setQuestionNumbers((current) => ({
                      ...current,
                      [stage]: event.target.value,
                    }))
                  }
                />
                <button
                  type="button"
                  className="facilitator-jump-btn"
                  disabled={pending !== null || questionJumpPending !== null}
                  onClick={() => void handleQuestionJump(stage)}
                >
                  {questionJumpPending === stage ? "..." : "انتقال"}
                </button>
              </label>
            ))}
          </div>
          {error ? <p className="facilitator-inline-error">{error}</p> : null}
        </div>
      </div>
    </div>
  );
}
