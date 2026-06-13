"use client";

const STAGES = [
  {
    name: "اجمعوا الكنوز",
    rule: "7 دقائق · حتى 50 سؤالاً · +5 لكل إجابة صحيحة · لا خصم.",
  },
  {
    name: "فتشوا الكتب",
    rule: "قراءة 3 دقائق ثم 4 مجالات (2.5 دقيقة لكل مجال) · 5 أسئلة لكل مجال · +15 صحيح.",
  },
  {
    name: "على المحك",
    rule: "لوحة 5 مجالات × 6 أسئلة · اختيار 15 ث / إجابة 20 ث / إعلان 10 ث · نقاط حسب الصعوبة.",
  },
  {
    name: "اثبتوا بالحق",
    rule: "15 سؤالاً جماعياً · نقاط متتابعة Pi = 15 + ((Si − 1) × 2) · الخطأ يصفّر التسلسل.",
  },
];

export function FacilitatorAboutTab() {
  return (
    <div className="space-y-6">
      <div className="facilitator-card">
        <div className="facilitator-card__head">
          <div>
            <h3 className="facilitator-card__title">سفراء المسيح</h3>
            <p className="facilitator-card__desc">نحيا بالكلمة... ونشهد للحق</p>
          </div>
        </div>
        <p className="text-sm leading-7 text-[#143A5A]">
          مسابقة كتابية من أربع مراحل. الميسر أو المشرف العام فقط يتحكم في سير
          المسابقة، وكل الشاشات (الفرق، الجمهور) تقرأ الحالة لحظياً من سير المسابقة المركزي.
        </p>
      </div>

      <div className="facilitator-card">
        <div className="facilitator-card__head">
          <div>
            <h3 className="facilitator-card__title">المراحل وقواعدها</h3>
            <p className="facilitator-card__desc">ملخص سريع لقواعد كل مرحلة.</p>
          </div>
        </div>
        <ol className="facilitator-about-list">
          {STAGES.map((stage, index) => (
            <li key={stage.name} className="facilitator-about-item">
              <span className="facilitator-about-index">{index + 1}</span>
              <div>
                <p className="font-black text-[#143A5A]">{stage.name}</p>
                <p className="text-sm leading-6 text-muted-foreground">{stage.rule}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
