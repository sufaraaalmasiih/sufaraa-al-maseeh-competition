"use client";

import { OpenAudienceDisplayActions } from "@/features/audience/components/open-audience-display-actions";
import { FacilitatorInlineAudienceDisplay } from "@/features/facilitator/components/facilitator-inline-audience-display";

export function FacilitatorAudienceTab() {
  return (
    <div className="space-y-4">
      <div className="facilitator-card">
        <div className="facilitator-card__head">
          <div>
            <h3 className="facilitator-card__title">شاشة الجمهور</h3>
            <p className="facilitator-card__desc">
              المعاينة أدناه داخل لوحة الميسر. للشاشة الكبيرة: افتح «تبويب جديد» واترك الميسر مفتوحاً في
              تبويب آخر — أو انسخ الرابط لجهاز العرض. على شاشة الجمهور اضغط «ملء الشاشة الآن» لملء الشاشة.
              تجنّب تسجيل دخول فريق في نفس المتصفح أثناء التشغيل.
            </p>
          </div>
        </div>

        <OpenAudienceDisplayActions />
      </div>

      <div className="facilitator-card audience-preview-card">
        <FacilitatorInlineAudienceDisplay />
      </div>
    </div>
  );
}
