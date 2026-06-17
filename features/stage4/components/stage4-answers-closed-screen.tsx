"use client";

import { Stage4TeamStatusScreen } from "@/features/stage4/components/stage4-team-status-screen";
import { STAGE4_NAME } from "@/features/stage4/stage4-constants";

interface Stage4AnswersClosedScreenProps {
  questionIndex: number;
  questionCount: number;
  variant?: "team" | "audience";
}

export function Stage4AnswersClosedScreen({
  questionIndex,
  questionCount,
  variant = "team",
}: Stage4AnswersClosedScreenProps) {
  const questionLabel = `السؤال ${Math.min(questionIndex + 1, questionCount)} من ${questionCount}`;

  if (variant === "team") {
    return (
      <Stage4TeamStatusScreen
        panelTitle="تم إغلاق الإجابات"
        panelSubtitle="بانتظار إعلان النتيجة"
        questionIndex={questionIndex}
        questionCount={questionCount}
        tone="closed"
      />
    );
  }

  return (
    <section className="competition-stage-screen competition-stage-screen--animated">
      <div className="competition-stage-screen__card glass-card-white">
        <span className="competition-stage-screen__badge competition-stage-screen__badge--blue">
          {STAGE4_NAME}
        </span>
        <h2 className="competition-stage-screen__title">بانتظار الإعلان</h2>
        <p className="competition-stage-screen__subtitle">{questionLabel}</p>
        <div className="competition-stage-screen__wait">
          <span aria-hidden className="competition-stage-screen__wait-pulse" />
          <p className="competition-stage-screen__wait-title">تم إغلاق الإجابات</p>
          <p className="competition-stage-screen__wait-hint">ستُعرض النتائج قريباً</p>
        </div>
      </div>
    </section>
  );
}
