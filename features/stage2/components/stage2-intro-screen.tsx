import { STAGE2_NAME } from "@/features/stage2/stage2-constants";

const RULES = [
  "قراءة المرجع لمدة 3 دقائق",
  "أربعة مجالات يوزعها الفريق",
  "كل إجابة صحيحة = 15 نقطة",
  "لا يوجد خصم على الإجابات الخاطئة",
];

export function Stage2IntroScreen() {
  return (
    <section className="competition-stage-intro-wrap">
      <div className="competition-stage-intro-card">
        <span className="competition-stage-screen__badge">{STAGE2_NAME}</span>
        <h2 className="competition-stage-intro-card__title">جاهزون للتحدي؟</h2>
        <p className="competition-stage-intro-card__lead">
          اختبار الفهم والتركيز في نص من الكتاب المقدس
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
