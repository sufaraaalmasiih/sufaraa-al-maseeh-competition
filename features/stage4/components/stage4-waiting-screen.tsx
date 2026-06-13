"use client";

import { STAGE4_NAME } from "@/features/stage4/stage4-constants";

interface Stage4WaitingScreenProps {
  questionIndex: number;
  questionCount: number;
  variant?: "team" | "facilitator" | "audience";
}

export function Stage4WaitingScreen({
  questionIndex,
  questionCount,
  variant = "team",
}: Stage4WaitingScreenProps) {
  const isFirst = questionIndex === 0;
  const message = isFirst ? "بانتظار السؤال الأول..." : "بانتظار السؤال التالي...";

  if (variant === "team") {
    return (
      <section className="competition-stage-screen">
        <div className="competition-stage-screen__card glass-card-white">
          <span className="competition-stage-screen__badge competition-stage-screen__badge--blue">
            {STAGE4_NAME}
          </span>
          <h2 className="competition-stage-screen__title">{message}</h2>
          <p className="competition-stage-screen__subtitle">
            السؤال {Math.min(questionIndex + 1, questionCount)} من {questionCount}
          </p>
          <div className="competition-stage-screen__wait">
            <span aria-hidden className="competition-stage-screen__wait-pulse" />
            <p className="competition-stage-screen__wait-title">بانتظار فتح السؤال</p>
            <p className="competition-stage-screen__wait-hint">
              ستظهر الأسئلة هنا عندما يفتحها الميسر للجميع.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <div className="glass-card-premium space-y-4 p-8 text-center">
      <p className="text-xs font-bold text-[#2388C4]">{STAGE4_NAME}</p>
      <h2 className="text-2xl font-black text-[#143A5A]">{message}</h2>
      <p className="text-sm font-semibold" style={{ color: "rgba(20,58,90,0.55)" }}>
        السؤال {Math.min(questionIndex + 1, questionCount)} من {questionCount}
      </p>
    </div>
  );
}
