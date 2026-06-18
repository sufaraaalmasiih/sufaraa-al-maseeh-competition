"use client";

import { Maximize2, Minimize2 } from "lucide-react";
import { useState } from "react";
import { OpenAudienceDisplayActions } from "@/features/audience/components/open-audience-display-actions";
import { FacilitatorInlineAudienceDisplay } from "@/features/facilitator/components/facilitator-inline-audience-display";
import { setAudienceFullscreen } from "@/features/competition-session/competition-session-controls";

export function FacilitatorAudienceTab() {
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  async function toggleFullscreen(enabled: boolean) {
    setBusy(true);
    setFeedback(null);
    try {
      await setAudienceFullscreen(enabled);
      setFeedback(
        enabled
          ? "تم تفعيل وضع العرض الكامل. على شاشة الجمهور اضغط «ملء الشاشة الآن»."
          : "تم إلغاء وضع ملء الشاشة.",
      );
    } catch {
      setFeedback("تعذر تغيير وضع العرض.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="facilitator-card">
        <div className="facilitator-card__head">
          <div>
            <h3 className="facilitator-card__title">شاشة الجمهور</h3>
            <p className="facilitator-card__desc">
              المعاينة أدناه داخل لوحة الميسر. للشاشة الكبيرة: افتح «تبويب جديد» واترك الميسر مفتوحاً في
              تبويب آخر — أو انسخ الرابط لجهاز العرض. تجنّب تسجيل دخول فريق في نفس المتصفح أثناء التشغيل.
            </p>
          </div>
        </div>

        <OpenAudienceDisplayActions />

        <div className="facilitator-timer__buttons">
          <button
            type="button"
            className="facilitator-btn facilitator-btn--outline"
            disabled={busy}
            onClick={() => void toggleFullscreen(true)}
          >
            <Maximize2 className="h-4 w-4" aria-hidden />
            تفعيل وضع العرض الكامل
          </button>
          <button
            type="button"
            className="facilitator-btn facilitator-btn--outline"
            disabled={busy}
            onClick={() => void toggleFullscreen(false)}
          >
            <Minimize2 className="h-4 w-4" aria-hidden />
            إلغاء وضع العرض الكامل
          </button>
        </div>

        {feedback ? <p className="facilitator-inline-success">{feedback}</p> : null}
      </div>

      <div className="facilitator-card audience-preview-card">
        <FacilitatorInlineAudienceDisplay />
      </div>
    </div>
  );
}
