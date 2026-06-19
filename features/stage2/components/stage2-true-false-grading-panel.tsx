"use client";

import { useEffect, useState } from "react";
import { onSnapshot } from "firebase/firestore";
import { Check, Scale } from "lucide-react";
import { answersCollectionRef } from "@/firebase/firestore";
import {
  finalizeStage2TrueFalseGrading,
  setStage2TrueFalseGradeStep,
  type Stage2GradeStep,
} from "@/features/stage2/grade-stage2-true-false-answer";

interface PendingGradingRow {
  id: string;
  teamName: string;
  statement: string;
  selectedWrongPart: string;
  correctionText: string;
  expectedCorrection: string;
  facilitatorMarkedWrong: boolean;
  wrongPartIdentified: boolean;
  correctionApproved: boolean;
  pointsDelta: number;
}

function usePendingTrueFalseAnswers(): PendingGradingRow[] {
  const [rows, setRows] = useState<PendingGradingRow[]>([]);

  useEffect(() => {
    return onSnapshot(answersCollectionRef("main"), (snapshot) => {
      const list: PendingGradingRow[] = [];
      snapshot.forEach((document) => {
        const data = document.data();
        if (
          data.field === "trueFalseCorrect" &&
          data.needsGrading === true &&
          data.gradingComplete !== true
        ) {
          list.push({
            id: document.id,
            teamName: typeof data.teamName === "string" ? data.teamName : "فريق",
            statement: typeof data.questionText === "string" ? data.questionText : "",
            selectedWrongPart:
              typeof data.selectedWrongPart === "string" ? data.selectedWrongPart : "",
            correctionText:
              typeof data.correctionText === "string" ? data.correctionText : "",
            expectedCorrection:
              typeof data.expectedCorrection === "string" ? data.expectedCorrection : "",
            facilitatorMarkedWrong: data.facilitatorMarkedWrong === true,
            wrongPartIdentified: data.wrongPartIdentified === true,
            correctionApproved: data.correctionApproved === true,
            pointsDelta: typeof data.pointsDelta === "number" ? data.pointsDelta : 0,
          });
        }
      });
      setRows(list);
    });
  }, []);

  return rows;
}

const STEPS: { step: Stage2GradeStep; label: string; flag: keyof PendingGradingRow }[] = [
  { step: "markedWrong", label: "تأكيد «خطأ» (+5)", flag: "facilitatorMarkedWrong" },
  { step: "wrongPart", label: "تحديد الجزء الخاطئ (+5)", flag: "wrongPartIdentified" },
  { step: "correction", label: "اعتماد التصحيح (+5)", flag: "correctionApproved" },
];

export function Stage2TrueFalseGradingPanel() {
  const rows = usePendingTrueFalseAnswers();
  const [busyId, setBusyId] = useState<string | null>(null);

  if (rows.length === 0) {
    return null;
  }

  async function toggle(answerId: string, step: Stage2GradeStep, value: boolean) {
    setBusyId(answerId);
    try {
      await setStage2TrueFalseGradeStep({ answerId, step, value });
    } finally {
      setBusyId(null);
    }
  }

  async function finalize(answerId: string) {
    setBusyId(answerId);
    try {
      await finalizeStage2TrueFalseGrading(answerId);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="mt-4 rounded-2xl border border-[#F59E0B]/40 bg-[#FFFBEB] p-4">
      <div className="mb-3 flex items-center gap-2">
        <Scale className="h-5 w-5 text-[#B45309]" aria-hidden />
        <h4 className="text-base font-black text-[#143A5A]">
          تحكيم «صح أو خطأ مع تصحيح» — نقاط جزئية ({rows.length})
        </h4>
      </div>
      <p className="mb-3 text-xs font-semibold text-[#92400E]">
        للإجابات الخاطئة: امنح +5 لكل خطوة صحيحة (تأكيد الخطأ، تحديد الجزء الخاطئ،
        اعتماد التصحيح). المجموع الكامل 15 نقطة.
      </p>

      <div className="max-h-[55vh] space-y-3 overflow-y-auto pr-1">
        {rows.map((row) => (
          <div key={row.id} className="rounded-xl border border-[#FDE68A] bg-white/80 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-black text-[#143A5A]">{row.teamName}</span>
              <span className="rounded-full bg-[#E9F6FC] px-2 py-0.5 text-sm font-black text-[#2388C4]">
                {row.pointsDelta} / 15
              </span>
            </div>
            <p className="mt-1 text-sm font-semibold text-[#143A5A]">{row.statement}</p>
            <p className="mt-1 text-xs font-bold text-[#B45309]">
              الجزء الذي حدّده الفريق كخطأ: {row.selectedWrongPart || "— لم يُحدِّد"}
            </p>
            <p className="mt-1 text-xs text-[#64748B]">
              تصحيح الفريق: {row.correctionText || "—"}
              {row.expectedCorrection ? ` · المتوقع: ${row.expectedCorrection}` : ""}
            </p>

            <div className="mt-2 flex flex-wrap gap-2">
              {STEPS.map(({ step, label, flag }) => {
                const active = row[flag] === true;
                return (
                  <button
                    key={step}
                    type="button"
                    disabled={busyId === row.id}
                    className={`facilitator-btn ${active ? "facilitator-btn--primary" : "facilitator-btn--outline"}`}
                    onClick={() => void toggle(row.id, step, !active)}
                  >
                    {active ? <Check className="h-4 w-4" aria-hidden /> : null}
                    {label}
                  </button>
                );
              })}
              <button
                type="button"
                disabled={busyId === row.id}
                className="facilitator-btn facilitator-btn--outline"
                onClick={() => void finalize(row.id)}
              >
                إنهاء التحكيم
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
