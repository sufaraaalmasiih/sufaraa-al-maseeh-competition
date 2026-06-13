"use client";

import { CheckCircle2 } from "lucide-react";

interface Stage1BlessingWaitScreenProps {
  stage1Score?: number;
}

/**
 * Shown when the team finishes the question bank while gameFlow is still stage1_running.
 * Matches old project moderatorWaitV960 / renderWaiting('finished', 1) — instant, no auto stage end.
 */
export function Stage1BlessingWaitScreen({
  stage1Score,
}: Stage1BlessingWaitScreenProps) {
  return (
    <section className="stage1-blessing-screen">
      <div className="stage1-blessing-screen__card glass-card-white">
        <span className="stage1-blessing-screen__badge">اجمعوا الكنوز</span>

        <div aria-hidden className="stage1-blessing-screen__icon">
          <CheckCircle2 className="h-9 w-9" strokeWidth={2.4} />
        </div>

        <h2 className="stage1-blessing-screen__title">أحسنتم!</h2>
        <p className="stage1-blessing-screen__subtitle">لقد أنهيتم مرحلة اجمعوا الكنوز</p>

        {typeof stage1Score === "number" ? (
          <div className="stage1-blessing-screen__score-card">
            <p className="stage1-blessing-screen__score-label">
              نتيجتكم الحالية في المرحلة الأولى
            </p>
            <p className="stage1-blessing-screen__score-value">{stage1Score}</p>
          </div>
        ) : null}

        <div className="stage1-blessing-screen__wait">
          <span aria-hidden className="stage1-blessing-screen__wait-pulse" />
          <p className="stage1-blessing-screen__wait-title">بانتظار توجيه الميسر</p>
          <p className="stage1-blessing-screen__wait-hint">
            سيتم فتح المرحلة التالية عندما يوجّهكم الميسر.
          </p>
        </div>
      </div>
    </section>
  );
}
