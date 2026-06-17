"use client";

import { BookOpen } from "lucide-react";
import { STAGE2_NAME } from "@/features/stage2/stage2-constants";

interface Stage2ReadingPanelProps {
  reference: string;
  passage?: string;
  hasReadingTimer: boolean;
}

export function Stage2ReadingPanel({
  reference,
  passage,
  hasReadingTimer,
}: Stage2ReadingPanelProps) {
  return (
    <section className="competition-stage-screen competition-stage-screen--reading">
      <div className="competition-stage-screen__card">
        <div className="competition-stage-screen__reading-header">
          <span className="competition-stage-screen__badge competition-stage-screen__badge--blue">
            {STAGE2_NAME}
          </span>
        </div>

        <div className="competition-stage-screen__reading-body">
          <div className="competition-stage-screen__reading-lead">
            <div aria-hidden className="competition-stage-screen__icon competition-stage-screen__icon--blue">
              <BookOpen className="h-8 w-8" strokeWidth={2.2} />
            </div>
            <div className="competition-stage-screen__reading-copy">
              <h2 className="competition-stage-screen__title">وقت القراءة</h2>
              <p className="competition-stage-screen__subtitle">
                افتحوا الإنجيل واقرأوا المرجع بتأنٍ
              </p>
            </div>
          </div>

          <div className="competition-stage-screen__reference-card">
            <p className="competition-stage-screen__reference-label">المرجع الكتابي</p>
            <p className="competition-stage-screen__reference-text">{reference || "—"}</p>
            {passage ? (
              <p className="competition-stage-screen__reference-passage">{passage}</p>
            ) : null}
          </div>
        </div>

        {!hasReadingTimer ? (
          <div className="competition-stage-screen__wait competition-stage-screen__wait--blue">
            <span aria-hidden className="competition-stage-screen__wait-pulse competition-stage-screen__wait-pulse--blue" />
            <p className="competition-stage-screen__wait-title">بانتظار بدء المؤقت</p>
            <p className="competition-stage-screen__wait-hint">
              سيبدأ مؤقت القراءة عندما يوجّهكم الميسر
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
}
