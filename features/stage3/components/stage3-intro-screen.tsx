"use client";

import { STAGE3_NAME } from "@/features/stage3/stage3-constants";
import { useTimerDurations } from "@/features/facilitator/use-timer-durations";

export function Stage3IntroScreen() {
  const durations = useTimerDurations();

  const rules = [
    "اختاروا السؤال من لوحة المرحلة",
    `لديكم ${durations.stage3Selection} ثانية لاختيار السؤال`,
    `لديكم ${durations.stage3Answer} ثانية للإجابة`,
    `الإعلان يستمر ${durations.stage3Reveal} ثوانٍ`,
    "النقاط حسب قيمة السؤال على اللوحة",
  ];

  return (
    <section className="competition-stage-intro-wrap">
      <div className="competition-stage-intro-card">
        <span className="competition-stage-screen__badge">{STAGE3_NAME}</span>
        <h2 className="competition-stage-intro-card__title">جاهزون للتحدي؟</h2>
        <p className="competition-stage-intro-card__lead">
          مرحلة الأسئلة والإجابات السريعة — اختاروا بحكمة واجيبوا بدقة
        </p>
        <ul className="competition-stage-rules">
          {rules.map((rule) => (
            <li key={rule} className="competition-stage-rule">
              {rule}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
