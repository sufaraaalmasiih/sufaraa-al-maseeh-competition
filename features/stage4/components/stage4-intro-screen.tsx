"use client";

import { STAGE4_NAME } from "@/features/stage4/stage4-constants";

const RULES = [
  "تحدي جماعي لكل الفرق معاً",
  "الإجابة الصحيحة تضيف نقاطاً للفريق",
  "الإجابة الخاطئة قد تخصم من رصيدكم",
  "بانتظار الميسر لفتح كل سؤال",
];

export function Stage4IntroScreen() {
  return (
    <section className="competition-stage-intro-wrap">
      <div className="competition-stage-intro-card">
        <span className="competition-stage-screen__badge competition-stage-screen__badge--blue">
          {STAGE4_NAME}
        </span>
        <h2 className="competition-stage-intro-card__title">المرحلة الرابعة</h2>
        <p className="competition-stage-intro-card__lead">
          تحدي جماعي — بانتظار بدء الميسر للمرحلة
        </p>
        <ul className="competition-stage-rules">
          {RULES.map((rule) => (
            <li key={rule} className="competition-stage-rule">
              {rule}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
