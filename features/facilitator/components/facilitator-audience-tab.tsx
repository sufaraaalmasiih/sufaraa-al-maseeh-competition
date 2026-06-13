"use client";

import { FacilitatorAudiencePreview } from "@/features/facilitator/components/facilitator-audience-preview";

export function FacilitatorAudienceTab() {
  return (
    <div className="space-y-4">
      <div className="facilitator-card">
        <div className="facilitator-card__head">
          <div>
            <h3 className="facilitator-card__title">شاشة الجمهور</h3>
            <p className="facilitator-card__desc">
              معاينة مباشرة لما يراه الجمهور. افتحها في نافذة منفصلة للعرض على
              الشاشة الكبيرة.
            </p>
          </div>
        </div>
        <FacilitatorAudiencePreview />
      </div>
    </div>
  );
}
