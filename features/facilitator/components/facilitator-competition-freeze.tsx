"use client";

import { useState } from "react";
import { Snowflake } from "lucide-react";
import {
  freezeCompetition,
  unfreezeCompetition,
} from "@/features/facilitator/facilitator-flow-actions";

interface FacilitatorCompetitionFreezeProps {
  frozen: boolean;
}

export function FacilitatorCompetitionFreeze({ frozen }: FacilitatorCompetitionFreezeProps) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggleFreeze() {
    setPending(true);
    setError(null);
    try {
      if (frozen) {
        await unfreezeCompetition();
      } else {
        await freezeCompetition();
      }
    } catch {
      setError("تعذر تحديث حالة التجميد.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flow-freeze">
      <button
        type="button"
        className={frozen ? "facilitator-btn facilitator-btn--primary flow-freeze__btn" : "facilitator-btn facilitator-btn--outline flow-freeze__btn"}
        disabled={pending}
        onClick={() => void toggleFreeze()}
      >
        <Snowflake className="flow-freeze__icon" aria-hidden />
        {pending ? "جاري التحديث..." : frozen ? "إلغاء تجميد المسابقة" : "تجميد المسابقة"}
      </button>
      <p className="flow-freeze__hint">
        {frozen
          ? "المسابقة متوقفة — الفرق والجمهور يرون تنبيهاً والمؤقت متجمد."
          : "يوقف المؤقت ويعرض تنبيهاً على كل الشاشات عند مشاكل الإنترنت."}
      </p>
      {error ? <p className="facilitator-inline-error">{error}</p> : null}
    </div>
  );
}
