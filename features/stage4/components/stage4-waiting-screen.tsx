"use client";

import { Stage4TeamStatusScreen } from "@/features/stage4/components/stage4-team-status-screen";
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
  const panelTitle = isFirst ? "بانتظار السؤال الأول..." : "بانتظار السؤال التالي...";

  if (variant === "team") {
    return (
      <Stage4TeamStatusScreen
        panelTitle={panelTitle}
        panelSubtitle="ستظهر الأسئلة هنا عندما يفتحها الميسر للجميع."
        questionIndex={questionIndex}
        questionCount={questionCount}
        tone="waiting"
      />
    );
  }

  return (
    <section className="competition-stage-screen competition-stage-screen--animated">
      <div className="competition-stage-screen__card glass-card-white">
        <span className="competition-stage-screen__badge competition-stage-screen__badge--blue">
          {STAGE4_NAME}
        </span>
        <h2 className="competition-stage-screen__title">{panelTitle}</h2>
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
